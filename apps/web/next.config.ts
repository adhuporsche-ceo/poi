import type {NextConfig} from 'next';
const config:NextConfig={distDir:process.env.NEXT_BUILD_OUTPUT_DIR||'.next'}; export default config;
