import React from "react";
import S3Manager from "./components/S3Manager";

console.log("ENV REGION:", process.env.REACT_APP_S3_REGION);
console.log("ENV BUCKET:", process.env.REACT_APP_S3_BUCKET);

const App = () => (
    <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">🧺 S3 파일 관리</h1>
        <S3Manager />
    </div>
);

export default App;
