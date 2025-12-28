'use client';

import { UploadButton } from "@/lib/uploadthing";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "./ToastProvider";

interface ImageUploaderProps {
    value: string;
    onChange: (url: string) => void;
    endpoint?: "imageUploader";
}

export default function ImageUploader({
    value,
    onChange,
    endpoint = "imageUploader"
}: ImageUploaderProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    if (value) {
        return (
            <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-video w-full max-w-sm group">
                <img
                    src={value}
                    alt="Upload"
                    className="object-cover w-full h-full"
                />
                <button
                    onClick={() => onChange("")}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    type="button"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full max-w-sm">
            <div className="flex flex-col items-center justify-center gap-2 text-center">
                <div className="bg-blue-100 p-3 rounded-full">
                    <ImageIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-sm text-gray-600">
                    <UploadButton
                        endpoint={endpoint}
                        onUploadBegin={() => setLoading(true)}
                        onClientUploadComplete={(res) => {
                            setLoading(false);
                            if (res && res[0]) {
                                onChange(res[0].url);
                                showToast("Image uploaded successfully", "success");
                            }
                        }}
                        onUploadError={(error: Error) => {
                            setLoading(false);
                            showToast(`Upload failed: ${error.message}`, "error");
                        }}
                        appearance={{
                            button: "bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors",
                            allowedContent: "text-xs text-gray-400 mt-1"
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
