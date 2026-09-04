# 1. Сценарий за стартиране (Runtime stage)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# 2. Сценарий за компилиране (Build stage)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Копиране на .csproj файла и възстановяване на пакетите (restore)
COPY ["CulinaryBlog.csproj", "."]
RUN dotnet restore "./CulinaryBlog.csproj"

# Копиране на целия останал код и компилиране
COPY . .
WORKDIR "/src/."
RUN dotnet build "./CulinaryBlog.csproj" -c $BUILD_CONFIGURATION -o /app/build

# 3. Публикуване на проекта (Publish stage)
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./CulinaryBlog.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# 4. Финално изображение
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CulinaryBlog.dll"]