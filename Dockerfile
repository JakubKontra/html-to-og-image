# Build Lambda package with Chromium binaries for x86_64 Lambda
FROM --platform=linux/amd64 public.ecr.aws/lambda/nodejs:22

WORKDIR /build

# Install zip utility
RUN dnf install -y zip

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (will install correct platform binaries)
RUN npm ci --omit=dev

# Copy compiled application code
COPY dist/ ./dist/

# Create deployment package
RUN zip -r function.zip dist node_modules package.json

CMD ["cp", "function.zip", "/output/"]
