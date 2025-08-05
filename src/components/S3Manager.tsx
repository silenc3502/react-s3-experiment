import React, { useEffect, useState } from "react";
import {
    S3Client,
    ListObjectsV2Command,
    PutObjectCommand,
    DeleteObjectCommand,
    CopyObjectCommand,
} from "@aws-sdk/client-s3";

const REGION = process.env.REACT_APP_S3_REGION!;
const BUCKET = process.env.REACT_APP_S3_BUCKET!;
const ACCESS_KEY = process.env.REACT_APP_S3_ACCESS_KEY!;
const SECRET_KEY = process.env.REACT_APP_S3_SECRET_KEY!;

const s3 = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
    },
});

// 이미지 확장자 확인 유틸
const isImageFile = (filename: string) =>
    /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(filename);

function S3Manager() {
    const [files, setFiles] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [newName, setNewName] = useState("");
    const [renamingKey, setRenamingKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const res = await s3.send(
                new ListObjectsV2Command({
                    Bucket: BUCKET,
                    Prefix: "uploads/",
                })
            );
            setFiles(res.Contents || []);
        } catch (err) {
            console.error("파일 목록 조회 실패:", err);
        }
        setLoading(false);
    };

    const uploadFile = async () => {
        if (!selectedFile) return;
        setLoading(true);

        const key = `uploads/${Date.now()}_${selectedFile.name}`;

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            await s3.send(
                new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: key,
                    Body: uint8Array,
                    ContentType: selectedFile.type,
                })
            );
            setSelectedFile(null);
            (document.getElementById("fileInput") as HTMLInputElement).value = "";
            await fetchFiles();
            alert("업로드 완료");
        } catch (err) {
            console.error("업로드 실패:", err);
            alert("업로드 실패");
        }

        setLoading(false);
    };

    const deleteFile = async (key: string) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        setLoading(true);

        try {
            await s3.send(
                new DeleteObjectCommand({
                    Bucket: BUCKET,
                    Key: key,
                })
            );
            await fetchFiles();
            alert("삭제 완료");
        } catch (err) {
            console.error("삭제 실패:", err);
            alert("삭제 실패");
        }

        setLoading(false);
    };

    const renameFile = async (oldKey: string) => {
        if (!newName.trim()) {
            alert("새 이름을 입력하세요.");
            return;
        }
        const newKey = `uploads/${newName.trim()}`;
        setLoading(true);

        try {
            await s3.send(
                new CopyObjectCommand({
                    Bucket: BUCKET,
                    CopySource: `${BUCKET}/${oldKey}`,
                    Key: newKey,
                })
            );
            await s3.send(
                new DeleteObjectCommand({
                    Bucket: BUCKET,
                    Key: oldKey,
                })
            );
            setNewName("");
            setRenamingKey(null);
            await fetchFiles();
            alert("이름 변경 완료");
        } catch (err) {
            console.error("이름 변경 실패:", err);
            alert("이름 변경 실패");
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md mt-10">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">📁 S3 파일 관리</h1>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <input
                    id="fileInput"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full sm:w-auto border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={uploadFile}
                    disabled={!selectedFile || loading}
                    className={`w-full sm:w-auto px-6 py-2 text-white font-medium rounded ${
                        selectedFile && !loading
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-gray-400 cursor-not-allowed"
                    } transition`}
                >
                    {loading ? "업로드 중..." : "업로드"}
                </button>
            </div>

            {loading && (
                <p className="text-center text-sm text-gray-500 mb-4">⏳ 로딩 중입니다...</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {files.length === 0 && !loading && (
                    <p className="text-center text-gray-400 col-span-full">파일이 없습니다.</p>
                )}

                {files.map((file) => {
                    const fileName = file.Key.replace("uploads/", "");
                    const fileUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${file.Key}`;
                    const isImage = isImageFile(fileName);

                    return (
                        <div
                            key={file.Key}
                            className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md flex flex-col"
                        >
                            {isImage ? (
                                <a href={fileUrl} target="_blank" rel="noreferrer">
                                    <img
                                        src={fileUrl}
                                        alt={fileName}
                                        className="w-full h-48 object-cover rounded mb-2"
                                    />
                                </a>
                            ) : (
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline mb-2 break-all"
                                >
                                    {fileName}
                                </a>
                            )}

                            {renamingKey === file.Key ? (
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="새 이름"
                                        className="border border-gray-300 rounded px-2 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                    <button
                                        onClick={() => renameFile(file.Key!)}
                                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                                    >
                                        저장
                                    </button>
                                    <button
                                        onClick={() => {
                                            setRenamingKey(null);
                                            setNewName("");
                                        }}
                                        className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-sm"
                                    >
                                        취소
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        onClick={() => {
                                            setRenamingKey(file.Key);
                                            setNewName(fileName);
                                        }}
                                        className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 text-sm"
                                    >
                                        이름 변경
                                    </button>
                                    <button
                                        onClick={() => deleteFile(file.Key!)}
                                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                                    >
                                        삭제
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default S3Manager;
