type RouteHandlerConfig = {
    /**
     * The URL to where your route handler is hosted. This is called via webhook
     * after your file is uploaded. UploadThing attempts to automatically detect
     * this value based on the request URL and headers. You can override this if
     * the automatic detection fails.
     */
    callbackUrl?: string;
    /**
     * Your UploadThing app id. You can find this on the UploadThing dashboard.
     * @default `env.UPLOADTHING_APP_ID`
     */
    uploadthingId?: string;
    /**
     * Your UploadThing API key. You can find this on the UploadThing dashboard.
     * @default `env.UPLOADTHING_KEY`
     */
    uploadthingSecret?: string;
    /**
     * Enable more verbose logging.
     * @default `info`
     * @since v6.2
     */
    logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'trace';
    /**
     * Used to determine whether to run dev hook or not
     * @default `env.NODE_ENV === "development" || env.NODE_ENV === "dev"`
     * @since v6.3
     */
    isDev?: boolean;
    /**
     * Used to override the fetch implementation
     * @default `globalThis.fetch`
     * @since v6.3
     */
    fetch?: FetchEsque;
};
