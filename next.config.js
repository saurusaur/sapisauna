const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // PWA 설정은 나중에 추가
}

module.exports = withSentryConfig(nextConfig, {
  // 소스맵을 Sentry에만 업로드, 브라우저에는 노출하지 않음
  hideSourceMaps: true,

  // Sentry 조직/프로젝트 정보 (환경변수로 관리)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // 빌드 중 소스맵 자동 업로드 (CI/배포 시)
  // SENTRY_AUTH_TOKEN 환경변수가 없으면 자동으로 스킵됨
  silent: true,
})
