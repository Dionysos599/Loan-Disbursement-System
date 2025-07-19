#!/bin/bash

# 快速重启脚本 - 用于日常开发
# 用法: ./quick-restart.sh [service_name]
# 例如: ./quick-restart.sh data-ingestion
#       ./quick-restart.sh frontend

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 显示帮助
show_help() {
    echo "快速重启脚本"
    echo ""
    echo "用法: $0 [service_name]"
    echo ""
    echo "服务名称:"
    echo "  data-ingestion   - 数据摄入服务 (端口: 8081)"
    echo "  forecasting      - 预测服务 (端口: 8082)"
    echo "  disbursement     - 放款服务 (端口: 8080)"
    echo "  frontend         - 前端 (端口: 3000)"
    echo "  backend          - 所有后端服务"
    echo "  all              - 所有服务"
    echo ""
    echo "示例:"
    echo "  $0 data-ingestion    # 重启数据摄入服务"
    echo "  $0 frontend          # 重启前端"
    echo "  $0 backend           # 重启所有后端服务"
}

# 主函数
main() {
    local service=${1:-"help"}
    
    # 检查是否在正确的目录
    if [ ! -f "docker-compose.yml" ]; then
        echo "请在docker目录下运行此脚本"
        exit 1
    fi
    
    # 显示帮助
    if [ "$service" = "help" ] || [ "$service" = "-h" ] || [ "$service" = "--help" ]; then
        show_help
        exit 0
    fi
    
    print_info "重启服务: $service"
    
    case $service in
        "data-ingestion")
            docker-compose restart data-ingestion-service
            print_success "数据摄入服务重启成功"
            ;;
        "forecasting")
            docker-compose restart forecasting-service
            print_success "预测服务重启成功"
            ;;
        "disbursement")
            docker-compose restart disbursement-service
            print_success "放款服务重启成功"
            ;;
        "frontend")
            docker-compose restart frontend
            print_success "前端重启成功"
            ;;
        "backend")
            docker-compose restart data-ingestion-service forecasting-service disbursement-service
            print_success "所有后端服务重启成功"
            ;;
        "all")
            docker-compose restart
            print_success "所有服务重启成功"
            ;;
        *)
            print_warning "未知的服务: $service"
            show_help
            exit 1
            ;;
    esac
    
    print_info "等待服务启动..."
    sleep 3
    
    # 显示服务状态
    print_info "服务状态:"
    docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
}

main "$@" 