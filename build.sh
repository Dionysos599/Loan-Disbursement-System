cd /Users/lam/Documents/Work/American\ Plus\ Bank/loan-disbursement-system/docker
./build.sh && docker-compose up -d --build && sleep 10 && ./test-system.sh
docker-compose up -d --build frontend
echo "\nFrontend is running on http://localhost:3000"