FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y curl git bash

# Install Foundry
RUN curl -L https://foundry.paradigm.xyz | bash

# Add foundry to PATH
ENV PATH="/root/.foundry/bin:${PATH}"

# Run foundryup to install binaries
RUN foundryup

WORKDIR /app

