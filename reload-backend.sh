#!/bin/bash

echo "🔄 重新部署核心后端服务 (loan-forecast)..."
echo "ℹ️  系统已简化：只有一个核心服务 loan-forecast-service"
echo "ℹ️  该服务包含：文件上传、数据处理、预测算法、历史管理"

# 编译后端
echo "📦 编译 loan-forecast 服务..."
cd backend/loan-forecast
mvn clean package -DskipTests

if [ $? -ne 0 ]; then
    echo "❌ 编译失败！"
    exit 1
fi

# 重新构建和启动容器
echo "🐳 重新构建并启动 Docker 容器..."
cd ../../docker
docker-compose build loan-forecast-service
docker-compose up -d loan-forecast-service

if [ $? -eq 0 ]; then
    echo "✅ 核心后端服务重新部署完成！"
    echo ""
    echo "🧪 运行系统测试："
    echo "./test-system.sh"
    echo ""
    echo "💡 简化后的系统架构："
    echo "- 核心服务: loan-forecast-service (端口 8081)"
    echo "- 功能包含: 文件上传 + 数据处理 + 预测算法 + 历史管理"
    echo "- 前端: React (端口 3000)"
    echo "- 基础设施: PostgreSQL (5432) + Redis (6379)"
else
    echo "❌ Docker 部署失败！"
    exit 1
fi 