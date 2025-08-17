// app/api/download/route.ts
import { NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get("url");
        // 프론트에서 보낸 format 파라미터를 받습니다. 기본값은 'mp4'.
        const format = searchParams.get("format") || "mp4";

        if (!url || !ytdl.validateURL(url)) {
            return NextResponse.json(
                { error: "유효한 유튜브 URL이 아닙니다." },
                { status: 400 }
            );
        }

        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title;
        const sanitizedTitle = title.replace(/[\/\\?%*:|"<>]/g, "-");

        const headers = new Headers();

        // --- 포맷에 따라 분기 처리 ---
        if (format === "mp3") {
            // MP3(음원) 다운로드 로직
            const audioStream = ytdl(url, {
                quality: "highestaudio",
                filter: "audioonly",
            });

            headers.set(
                "Content-Disposition",
                `attachment; filename="${encodeURIComponent(
                    sanitizedTitle
                )}.mp3"`
            );
            headers.set("Content-Type", "audio/mpeg");
            return new Response(audioStream as any, { headers });
        } else {
            // MP4(영상) 다운로드 로직 (기존과 동일)
            const videoStream = ytdl(url, {
                quality: "highest", // 'highestvideo'는 소리가 안나올 수 있어 'highest'로 변경
                filter: "videoandaudio",
            });

            headers.set(
                "Content-Disposition",
                `attachment; filename="${encodeURIComponent(
                    sanitizedTitle
                )}.mp4"`
            );
            headers.set("Content-Type", "video/mp4");
            return new Response(videoStream as any, { headers });
        }
        // -------------------------
    } catch (error: any) {
        console.error(error);
        return NextResponse.json(
            {
                error: "영상을 처리하는 중 오류가 발생했습니다.",
                details: error.message,
            },
            { status: 500 }
        );
    }
}
