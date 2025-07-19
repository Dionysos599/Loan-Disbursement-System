#!/bin/bash

# 优化的构建脚本 - 支持选择性构建和重启
# 用法: ./build-optimized.sh [service_name] [action]
# 例如: ./build-optimized.sh data-ingestion rebuild
#       ./build-optimized.sh frontend restart
#       ./build-optimized.sh all rebuild

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "优化的构建脚本"
    echo ""
    echo "用法: $0 [service] [action]"
    echo ""
    echo "服务 (service):"
    echo "  all              - 所有服务"
    echo "  data-ingestion   - 数据摄入服务"
    echo "  forecasting      - 预测服务"
    echo "  disbursement     - 放款服务"
    echo "  frontend         - 前端"
    echo "  backend          - 所有后端服务"
    echo ""
    echo "操作 (action):"
    echo "  rebuild          - 重新构建并重启"
    echo "  restart          - 仅重启（不重新构建）"
    echo "  build            - 仅构建（不重启）"
    echo "  status           - 显示服务状态"
    echo ""
    echo "示例:"
    echo "  $0 data-ingestion rebuild    # 重新构建并重启数据摄入服务"
    echo "  $0 frontend restart          # 仅重启前端"
    echo "  $0 all rebuild               # 重新构建并重启所有服务"
    echo "  $0 backend build             # 仅构建所有后端服务"
}

# 构建单个后端服务
build_backend_service() {
    local service_name=$1
    local service_path="../backend/$service_name"
    
    print_info "构建后端服务: $service_name"
    
    if [ ! -d "$service_path" ]; then
        print_error "服务目录不存在: $service_path"
        return 1
    fi
    
    cd "$service_path"
    print_info "运行 Maven 构建..."
    mvn clean package -DskipTests
    
    if [ $? -eq 0 ]; then
        print_success "后端服务 $service_name 构建成功"
    else
        print_error "后端服务 $service_name 构建失败"
        return 1
    fi
    
    cd - > /dev/null
}

# 构建前端
build_frontend() {
    print_info "构建前端..."
    
    if [ ! -d "../frontend" ]; then
        print_error "前端目录不存在"
        return 1
    fi
    
    cd ../frontend
    print_info "运行 npm build..."
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "前端构建成功"
    else
        print_error "前端构建失败"
        return 1
    fi
    
    cd - > /dev/null
}

# 构建Docker镜像
build_docker_image() {
    local service_name=$1
    local image_name="docker-$service_name"
    
    print_info "构建Docker镜像: $image_name"
    
    case $service_name in
        "data-ingestion")
            docker build -t "$image_name" ../backend/data-ingestion
            ;;
        "forecasting")
            docker build -t "$image_name" ../backend/forecasting-service
            ;;
        "disbursement")
            docker build -t "$image_name" ../backend/disbursement-service
            ;;
        "frontend")
            docker build -t "$image_name" ../frontend
            ;;
        *)
            print_error "未知的服务: $service_name"
            return 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        print_success "Docker镜像 $image_name 构建成功"
    else
        print_error "Docker镜像 $image_name 构建失败"
        return 1
    fi
}

# 重启服务
restart_service() {
    local service_name=$1
    
    print_info "重启服务: $service_name"
    
    case $service_name in
        "data-ingestion")
            docker-compose restart data-ingestion-service
            ;;
        "forecasting")
            docker-compose restart forecasting-service
            ;;
        "disbursement")
            docker-compose restart disbursement-service
            ;;
        "frontend")
            docker-compose restart frontend
            ;;
        "backend")
            docker-compose restart data-ingestion-service forecasting-service disbursement-service
            ;;
        "all")
            docker-compose restart
            ;;
        *)
            print_error "未知的服务: $service_name"
            return 1
            ;;
    esac
    
    print_success "服务 $service_name 重启成功"
}

# 显示服务状态
show_status() {
    print_info "当前服务状态:"
    echo ""
    docker-compose ps
    echo ""
    print_info "服务健康检查:"
    
    # 检查后端服务
    local services=("data-ingestion" "forecasting" "disbursement")
    for service in "${services[@]}"; do
        local port=""
        case $service in
            "data-ingestion") port="8081" ;;
            "forecasting") port="8082" ;;
            "disbursement") port="8080" ;;
        esac
        
        if curl -s "http://localhost:$port/actuator/health" > /dev/null 2>&1; then
            print_success "$service 服务正常 (端口: $port)"
        else
            print_warning "$service 服务可能未启动 (端口: $port)"
        fi
    done
    
    # 检查前端
    if curl -s "http://localhost:3000" > /dev/null 2>&1; then
        print_success "前端服务正常 (端口: 3000)"
    else
        print_warning "前端服务可能未启动 (端口: 3000)"
    fi
}

    # 主函数
    main() {
        local service=${1:-"all"}
        local action=${2:-"rebuild"}
        
        # 特殊处理status命令
        if [ "$service" = "status" ]; then
            show_status
            exit 0
        fi
    
    # 检查是否在正确的目录
    if [ ! -f "docker-compose.yml" ]; then
        print_error "请在docker目录下运行此脚本"
        exit 1
    fi
    
    # 显示帮助
    if [ "$service" = "help" ] || [ "$service" = "-h" ] || [ "$service" = "--help" ]; then
        show_help
        exit 0
    fi
    
    print_info "开始处理: 服务=$service, 操作=$action"
    
    case $action in
        "rebuild")
            case $service in
                "data-ingestion")
                    build_backend_service "data-ingestion"
                    build_docker_image "data-ingestion"
                    restart_service "data-ingestion"
                    ;;
                "forecasting")
                    build_backend_service "forecasting-service"
                    build_docker_image "forecasting"
                    restart_service "forecasting"
                    ;;
                "disbursement")
                    build_backend_service "disbursement-service"
                    build_docker_image "disbursement"
                    restart_service "disbursement"
                    ;;
                "frontend")
                    build_frontend
                    build_docker_image "frontend"
                    restart_service "frontend"
                    ;;
                "backend")
                    build_backend_service "data-ingestion"
                    build_backend_service "forecasting-service"
                    build_backend_service "disbursement-service"
                    build_docker_image "data-ingestion"
                    build_docker_image "forecasting"
                    build_docker_image "disbursement"
                    restart_service "backend"
                    ;;
                "all")
                    build_backend_service "data-ingestion"
                    build_backend_service "forecasting-service"
                    build_backend_service "disbursement-service"
                    build_frontend
                    build_docker_image "data-ingestion"
                    build_docker_image "forecasting"
                    build_docker_image "disbursement"
                    build_docker_image "frontend"
                    restart_service "all"
                    ;;
                *)
                    print_error "未知的服务: $service"
                    show_help
                    exit 1
                    ;;
            esac
            ;;
        "restart")
            restart_service "$service"
            ;;
        "build")
            case $service in
                "data-ingestion")
                    build_backend_service "data-ingestion"
                    build_docker_image "data-ingestion"
                    ;;
                "forecasting")
                    build_backend_service "forecasting-service"
                    build_docker_image "forecasting"
                    ;;
                "disbursement")
                    build_backend_service "disbursement-service"
                    build_docker_image "disbursement"
                    ;;
                "frontend")
                    build_frontend
                    build_docker_image "frontend"
                    ;;
                "backend")
                    build_backend_service "data-ingestion"
                    build_backend_service "forecasting-service"
                    build_backend_service "disbursement-service"
                    build_docker_image "data-ingestion"
                    build_docker_image "forecasting"
                    build_docker_image "disbursement"
                    ;;
                "all")
                    build_backend_service "data-ingestion"
                    build_backend_service "forecasting-service"
                    build_backend_service "disbursement-service"
                    build_frontend
                    build_docker_image "data-ingestion"
                    build_docker_image "forecasting"
                    build_docker_image "disbursement"
                    build_docker_image "frontend"
                    ;;
                *)
                    print_error "未知的服务: $service"
                    show_help
                    exit 1
                    ;;
            esac
            ;;
        "status")
            show_status
            ;;
        *)
            print_error "未知的操作: $action"
            show_help
            exit 1
            ;;
    esac
    
    print_success "操作完成!"
    
    # 等待服务启动
    if [ "$action" = "rebuild" ] || [ "$action" = "restart" ]; then
        print_info "等待服务启动..."
        sleep 5
        show_status
    fi
}

# 运行主函数
main "$@" 