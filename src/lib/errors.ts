import { HTTPException } from "hono/http-exception";

export const notFound = (resource: string, id: string) =>
    new HTTPException(404, { message: `${resource} '${id}' not found` });

export const errorResponse = (error: unknown) => {
    if (error instanceof HTTPException) {
        return { error: { code: error.status, message: error.message } };
    }
    return { error: { code: 500, message: "Internal server error" } };
};