// app/api/download/route.ts
import { NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export async function GET(request: Request) {
    try {
        // ... (기존 url, format 가져오는 코드)
        const { searchParams } = new URL(request.url);
        const url = searchParams.get("url");
        const format = searchParams.get("format") || "mp4";

        if (!url || !ytdl.validateURL(url)) {
            return NextResponse.json(
                { error: "유효한 유튜브 URL이 아닙니다." },
                { status: 400 }
            );
        }

        // --- 쿠키를 포함한 요청 옵션 추가 ---
        const requestOptions = {
            requestOptions: {
                headers: {
                    cookie: process.env.YOUTUBE_COOKIE, // 환경 변수에서 쿠키 값 가져오기
                },
            },
        };
        // ---------------------------------

        const info = await ytdl.getInfo(url, requestOptions); // 옵션 전달
        const title = info.videoDetails.title;
        const sanitizedTitle = title.replace(/[\/\\?%*:|"<>]/g, "-");

        const headers = new Headers();

        if (format === "mp3") {
            const audioStream = ytdl(url, {
                ...requestOptions, // 옵션 전달
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
            return new Response(audioStream as unknown as ReadableStream, {
                headers,
            });
        } else {
            const videoStream = ytdl(url, {
                ...requestOptions, // 옵션 전달
                quality: "highest",
                filter: "videoandaudio",
            });
            headers.set(
                "Content-Disposition",
                `attachment; filename="${encodeURIComponent(
                    sanitizedTitle
                )}.mp4"`
            );
            headers.set("Content-Type", "video/mp4");
            return new Response(videoStream as unknown as ReadableStream, {
                headers,
            });
        }
    } catch (error: unknown) {
        console.error(error); // 서버 로그에 에러를 자세히 기록
        // 에러 메시지를 클라이언트에 더 구체적으로 전달
        return NextResponse.json(
            {
                error: "서버 처리 중 오류 발생",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
