FROM alpine:latest

# Install dependencies for foundry and script execution
RUN apk add --no-cache curl git bash libstdc++ gcompat

# Install Foundry
# We assume foundryup detects musl/alpine or we might need to force it.
# Usually curl | bash works.
SHELL ["/bin/bash", "-c"]
RUN curl -L https://foundry.paradigm.xyz | bash

# Add foundry to PATH
ENV PATH="/root/.foundry/bin:${PATH}"

# Run foundryup
RUN foundryup

WORKDIR /app
ENTRYPOINT ["/bin/bash", "-c"]

