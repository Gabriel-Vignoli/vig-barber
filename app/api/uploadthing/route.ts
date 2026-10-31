import { createRouteHandler } from "uploadthing/next"
import { uploadRouter } from "./core"

// Reads UPLOADTHING_TOKEN at request time. Without it uploads fail with an
// error toast, but the app still builds and runs.
export const { GET, POST } = createRouteHandler({ router: uploadRouter })
