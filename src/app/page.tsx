// app/page.tsx
"use client";

import { useState } from "react";

export default function HomePage() {
    const [url, setUrl] = useState("");
    const [format, setFormat] = useState("mp4"); // 'mp4' 또는 'mp3' 상태 추가
    const [error, setError] = useState("");
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (!url) {
            setError("다운로드할 유튜브 영상 URL을 입력해주세요.");
            return;
        }
        if (!url.includes("youtube.com/") && !url.includes("youtu.be/")) {
            setError("올바른 유튜브 영상 URL이 아닙니다.");
            return;
        }

        setError("");
        setIsDownloading(true);

        try {
            // API 요청 시 선택한 format을 쿼리 파라미터로 함께 보냄
            const res = await fetch(
                `/api/download?url=${encodeURIComponent(url)}&format=${format}`
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "다운로드에 실패했습니다.");
            }

            const contentDisposition = res.headers.get("Content-Disposition");
            // 기본 파일 이름을 선택한 포맷에 따라 동적으로 설정
            let filename = format === "mp4" ? "video.mp4" : "audio.mp3";
            if (contentDisposition) {
                const filenameMatch =
                    contentDisposition.match(/filename="(.+?)"/);
                if (filenameMatch && filenameMatch.length > 1) {
                    filename = decodeURIComponent(escape(filenameMatch[1]));
                }
            }

            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            a.remove();
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div
            style={{
                fontFamily: "sans-serif",
                maxWidth: "500px",
                margin: "50px auto",
                padding: "20px",
                border: "1px solid #ccc",
                borderRadius: "8px",
            }}
        >
            <h1>유튜브 다운로더</h1>
            <p>다운로드하려는 유튜브 영상의 URL을 입력하세요.</p>
            <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                style={{
                    width: "100%",
                    padding: "10px",
                    boxSizing: "border-box",
                    marginBottom: "10px",
                }}
            />

            {/* --- 포맷 선택 UI 추가 --- */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "20px" }}>
                <label>
                    <input
                        type="radio"
                        name="format"
                        value="mp4"
                        checked={format === "mp4"}
                        onChange={() => setFormat("mp4")}
                    />
                    MP4 (영상)
                </label>
                <label>
                    <input
                        type="radio"
                        name="format"
                        value="mp3"
                        checked={format === "mp3"}
                        onChange={() => setFormat("mp3")}
                    />
                    MP3 (음원)
                </label>
            </div>
            {/* ----------------------- */}

            <button
                onClick={handleDownload}
                disabled={isDownloading}
                style={{
                    width: "100%",
                    padding: "10px",
                    background: isDownloading ? "#ccc" : "#0070f3",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                }}
            >
                {isDownloading ? "다운로드 중..." : "다운로드"}
            </button>
            {error && (
                <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
            )}
        </div>
    );
}
