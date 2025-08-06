interface Env {
    mode: string | undefined;
    api: {
        REACT_APP_S3_REGION: string | undefined;
        REACT_APP_S3_BUCKET: string | undefined;
        REACT_APP_S3_ACCESS_KEY: string | undefined;
        REACT_APP_S3_SECRET_KEY: string | undefined;
    };
}

const env: Env = {
    mode: process.env.NODE_ENV,
    api: {
        REACT_APP_S3_REGION: process.env.REACT_APP_S3_REGION,
        REACT_APP_S3_BUCKET: process.env.REACT_APP_S3_BUCKET,
        REACT_APP_S3_ACCESS_KEY: process.env.REACT_APP_S3_ACCESS_KEY,
        REACT_APP_S3_SECRET_KEY: process.env.REACT_APP_S3_SECRET_KEY,
    },
};

export default env;
