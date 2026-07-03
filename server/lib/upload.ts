import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

export const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || mimeExt(file.mimetype);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

function mimeExt(mime: string) {
  if (mime.startsWith("audio/")) return ".webm";
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "application/pdf") return ".pdf";
  return "";
}

function isAllowedFile(file: Express.Multer.File) {
  if (file.mimetype.startsWith("image/")) return true;
  if (file.mimetype.startsWith("audio/")) return true;
  return /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|zip|rar|txt|webm|ogg|mp3|m4a|wav)$/i.test(
    file.originalname
  );
}

export const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname) || file.mimetype.startsWith("image/");
    if (allowed) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

export const chatUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (isAllowedFile(file)) cb(null, true);
    else cb(new Error("File type not allowed"));
  },
});

export const fileUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (isAllowedFile(file)) cb(null, true);
    else cb(new Error("File type not allowed"));
  },
});

export function deleteUploadFile(filePath: string | null | undefined) {
  if (!filePath) return;
  const filename = path.basename(filePath);
  const full = path.join(uploadsDir, filename);
  if (fs.existsSync(full)) fs.unlinkSync(full);
}

export function toPublicPath(filename: string) {
  return `/uploads/${filename}`;
}
