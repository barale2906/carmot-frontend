FROM node:20
WORKDIR /app

# Instalar Git (necesario para scripts que usen Git). Yarn viene con Node 20 (corepack).
RUN apt-get update && \
    apt-get install -y git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# El volumen se montará en tiempo de ejecución
# Las dependencias se instalan dentro del contenedor en ejecución (npm install)
