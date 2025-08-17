// app/api/download/route.ts
import { NextResponse } from "next/server";
// 봇 차단 문제를 피하기 위해 더 자주 업데이트되는 @distube/ytdl-core 사용을 권장합니다.
// 터미널에서 `npm install @distube/ytdl-core` 실행 후 사용하세요.
import ytdl from "@distube/ytdl-core";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get("url");
        const format = searchParams.get("format") || "mp4";

        // URL 유효성 검사
        if (!url || !ytdl.validateURL(url)) {
            return NextResponse.json(
                { error: "유효한 유튜브 URL이 아닙니다." },
                { status: 400 }
            );
        }

        // --- 배포 환경에서의 봇 차단을 피하기 위한 쿠키 옵션 ---
        // .env.local 파일과 Vercel 환경 변수에 YOUTUBE_COOKIE를 설정해야 합니다.
        const requestOptions = {
            requestOptions: {
                headers: {
                    // 환경 변수에서 쿠키 값을 가져옵니다. 값이 없으면 undefined가 됩니다.
                    cookie: process.env.YOUTUBE_COOKIE || "",
                },
            },
        };
        // ----------------------------------------------------

        // 영상 정보 가져오기 (파일 제목으로 사용)
        const info = await ytdl.getInfo(url, requestOptions);
        const title = info.videoDetails.title;
        // 파일 이름으로 사용할 수 없는 특수문자 제거
        const sanitizedTitle = title.replace(/[\/\\?%*:|"<>]/g, "-");

        const headers = new Headers();

        if (format === "mp3") {
            // MP3 (음원) 다운로드 로직
            const audioStream = ytdl(url, {
                ...requestOptions, // 쿠키 옵션 전달
                quality: "highestaudio",
                filter: "audioonly",
            });

            // 응답 헤더 설정
            headers.set(
                "Content-Disposition",
                `attachment; filename="${encodeURIComponent(
                    sanitizedTitle
                )}.mp3"`
            );
            headers.set("Content-Type", "audio/mpeg");

            // 스트림을 Response 객체로 변환하여 클라이언트에 반환
            return new Response(audioStream as unknown as ReadableStream, {
                headers,
            });
        } else {
            // MP4 (영상) 다운로드 로직
            const videoStream = ytdl(url, {
                ...requestOptions, // 쿠키 옵션 전달
                quality: "highest",
                filter: "videoandaudio",
            });

            // 응답 헤더 설정
            headers.set(
                "Content-Disposition",
                `attachment; filename="${encodeURIComponent(
                    sanitizedTitle
                )}.mp4"`
            );
            headers.set("Content-Type", "video/mp4");

            // 스트림을 Response 객체로 변환하여 클라이언트에 반환
            return new Response(videoStream as unknown as ReadableStream, {
                headers,
            });
        }
    } catch (error: unknown) {
        // 서버에서 발생하는 에러를 로그로 남겨 디버깅에 활용
        console.error("API Error:", error);

        // 클라이언트에게 에러 메시지를 전달
        return NextResponse.json(
            {
                error: "서버에서 영상을 처리하는 중 오류가 발생했습니다.",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
