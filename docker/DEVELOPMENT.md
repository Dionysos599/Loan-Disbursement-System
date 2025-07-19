# 开发环境构建指南

## 概述

为了提高开发效率，我们提供了多个构建脚本，支持选择性构建和重启服务。

## 脚本说明

### 1. 优化构建脚本 (`build-optimized.sh`)

**功能**: 支持选择性构建和重启，适合需要重新编译代码的场景

**用法**: `./build-optimized.sh [service] [action]`

**参数**:
- `service`: 服务名称
  - `data-ingestion` - 数据摄入服务
  - `forecasting` - 预测服务  
  - `disbursement` - 放款服务
  - `frontend` - 前端
  - `backend` - 所有后端服务
  - `all` - 所有服务
- `action`: 操作类型
  - `rebuild` - 重新构建并重启
  - `restart` - 仅重启（不重新构建）
  - `build` - 仅构建（不重启）
  - `status` - 显示服务状态

**示例**:
```bash
# 重新构建并重启数据摄入服务
./build-optimized.sh data-ingestion rebuild

# 仅重启前端（不重新构建）
./build-optimized.sh frontend restart

# 重新构建所有后端服务
./build-optimized.sh backend build

# 查看服务状态
./build-optimized.sh status
```

### 2. 快速重启脚本 (`quick-restart.sh`)

**功能**: 仅重启服务，不重新构建，适合配置修改或热重载场景

**用法**: `./quick-restart.sh [service]`

**参数**:
- `data-ingestion` - 数据摄入服务 (端口: 8081)
- `forecasting` - 预测服务 (端口: 8082)
- `disbursement` - 放款服务 (端口: 8080)
- `frontend` - 前端 (端口: 3000)
- `backend` - 所有后端服务
- `all` - 所有服务

**示例**:
```bash
# 重启数据摄入服务
./quick-restart.sh data-ingestion

# 重启前端
./quick-restart.sh frontend

# 重启所有后端服务
./quick-restart.sh backend
```

### 3. 原始构建脚本 (`build.sh`)

**功能**: 构建所有后端服务，适合完整构建场景

**用法**: `./build.sh`

## 开发流程建议

### 日常开发流程

1. **首次启动**:
   ```bash
   # 构建并启动所有服务
   ./build-optimized.sh all rebuild
   ```

2. **修改后端代码后**:
   ```bash
   # 如果修改了Java代码，需要重新构建
   ./build-optimized.sh data-ingestion rebuild
   
   # 如果只修改了配置文件，可以只重启
   ./quick-restart.sh data-ingestion
   ```

3. **修改前端代码后**:
   ```bash
   # 如果修改了React代码，需要重新构建
   ./build-optimized.sh frontend rebuild
   
   # 如果只修改了环境变量，可以只重启
   ./quick-restart.sh frontend
   ```

4. **检查服务状态**:
   ```bash
   ./build-optimized.sh status
   ```

### 效率优化建议

1. **避免不必要的构建**:
   - 只修改配置文件时，使用 `quick-restart.sh`
   - 只修改单个服务时，只构建该服务

2. **利用Docker缓存**:
   - Docker会缓存构建层，相同依赖的构建会更快
   - 频繁修改的代码放在Dockerfile的后面

3. **开发环境配置**:
   - 后端服务支持热重载（Spring Boot DevTools）
   - 前端支持热重载（React Fast Refresh）

## 服务端口

- **前端**: http://localhost:3000
- **数据摄入服务**: http://localhost:8081
- **预测服务**: http://localhost:8082
- **放款服务**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 常见问题

### Q: 为什么有时候重启后服务还是旧的代码？
A: 确保使用了正确的脚本：
- 修改了代码 → 使用 `build-optimized.sh [service] rebuild`
- 只修改配置 → 使用 `quick-restart.sh [service]`

### Q: 如何查看服务日志？
A: 使用Docker命令：
```bash
# 查看特定服务日志
docker logs loan-data-ingestion-service

# 实时查看日志
docker logs -f loan-data-ingestion-service

# 查看所有服务状态
docker-compose ps
```

### Q: 如何清理Docker缓存？
A: 如果需要完全重新构建：
```bash
# 清理所有Docker镜像和容器
docker system prune -a

# 重新构建所有服务
./build-optimized.sh all rebuild
```

## 性能对比

| 操作 | 原始脚本 | 优化脚本 | 快速重启 |
|------|----------|----------|----------|
| 重启单个服务 | 3-5分钟 | 30秒-2分钟 | 5-10秒 |
| 重启所有服务 | 10-15分钟 | 5-8分钟 | 30秒 |
| 仅修改配置 | 3-5分钟 | 30秒-2分钟 | 5-10秒 |

通过使用合适的脚本，可以显著提高开发效率！ 