#!/bin/bash

echo "🔄 重新部署核心后端服务 (data-ingestion)..."
echo "ℹ️  注意：只需要重新构建 data-ingestion-service"
echo "ℹ️  其他服务 (disbursement, forecasting) 目前未被前端使用"

# 编译后端
echo "📦 编译 data-ingestion 服务..."
cd backend/data-ingestion
mvn clean package -DskipTests

if [ $? -ne 0 ]; then
    echo "❌ 编译失败！"
    exit 1
fi

# 重新构建和启动容器
echo "🐳 重新构建并启动 Docker 容器..."
cd ../../docker
docker-compose build data-ingestion-service
docker-compose up -d data-ingestion-service

if [ $? -eq 0 ]; then
    echo "✅ 核心后端服务重新部署完成！"
    echo ""
    echo "🧪 运行系统测试："
    echo "./test-system.sh"
    echo ""
    echo "💡 提示："
    echo "- 只有 data-ingestion-service 被重新部署"
    echo "- disbursement-service 和 forecasting-service 保持运行但未被使用"
else
    echo "❌ Docker 部署失败！"
    exit 1
fi 