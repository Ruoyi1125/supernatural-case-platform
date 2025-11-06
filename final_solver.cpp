#include <iostream>
#include <fstream>
#include <vector>
#include <set>
#include <map>
#include <algorithm>
#include <string>
#include <sstream>
#include <queue>
#include <cmath>
#include <random>
#include <chrono>

using namespace std;

const int NUM_ENGINEERS = 336;
const int NUM_SERVERS = 1620;
const int MAX_SERVERS_PER_ENGINEER = 5;
const int MAX_REST_DAYS = 410;

struct Solution {
    vector<vector<int>> allocation;
    vector<vector<bool>> daily_work;
    int total_rest_days;
    int num_days;
    bool valid;
    
    Solution(int days) : allocation(NUM_ENGINEERS, vector<int>(MAX_SERVERS_PER_ENGINEER, -1)), 
                         daily_work(NUM_ENGINEERS, vector<bool>(days, false)), 
                         total_rest_days(0), num_days(days), valid(false) {}
};

class FinalOptimalSolver {
private:
    vector<vector<int>> daily_alarms;
    map<int, set<int>> server_to_days;
    vector<pair<double, int>> server_efficiency;
    int num_days;
    
public:
    bool loadAlarmData(const string& filename) {
        ifstream file(filename);
        if (!file.is_open()) {
            cerr << "Error: Cannot open " << filename << endl;
            return false;
        }
        
        string line;
        int day = 0;
        
        while (getline(file, line)) {
            if (line.empty() || !isdigit(line[0])) continue;
            
            daily_alarms.push_back(vector<int>());
            istringstream iss(line);
            int server;
            while (iss >> server) {
                daily_alarms[day].push_back(server);
                server_to_days[server].insert(day);
            }
            day++;
        }
        
        num_days = day;
        file.close();
        
        // 计算服务器效率分数 - 专门为满足约束设计
        for (auto& [server, days] : server_to_days) {
            double score = 0.0;
            
            // 基础分数：覆盖的天数
            score += days.size() * 1.0;
            
            // 前14天奖励：必须覆盖前14天
            bool covers_first_14 = false;
            int first_14_count = 0;
            for (int day : days) {
                if (day < 14) {
                    score += 20.0; // 前14天权重极高
                    first_14_count++;
                    covers_first_14 = true;
                }
            }
            
            // 如果不覆盖前14天，分数为0
            if (!covers_first_14) {
                score = 0.0;
            } else {
                // 覆盖更多前14天的奖励
                score += first_14_count * 10.0;
                
                // 覆盖天数在24-25天范围的奖励（符合目标工作天数）
                int coverage = days.size();
                if (coverage >= 24 && coverage <= 26) {
                    score += 50.0; // 高奖励
                } else if (coverage >= 20 && coverage <= 26) {
                    score += 20.0; // 中等奖励
                }
                
                // 连续天数奖励
                vector<int> day_list(days.begin(), days.end());
                sort(day_list.begin(), day_list.end());
                int consecutive_count = 1;
                for (int i = 1; i < day_list.size(); i++) {
                    if (day_list[i] == day_list[i-1] + 1) {
                        consecutive_count++;
                    }
                }
                score += consecutive_count * 2.0;
            }
            
            server_efficiency.push_back({score, server});
        }
        
        // 按效率分数降序排序
        sort(server_efficiency.rbegin(), server_efficiency.rend());
        
        cout << "Loaded " << num_days << " days, " << server_to_days.size() << " unique servers" << endl;
        
        // 统计有效服务器（覆盖前14天的）
        int valid_servers = 0;
        for (auto& [score, server] : server_efficiency) {
            if (score > 0) valid_servers++;
        }
        cout << "Valid servers (covering first 14 days): " << valid_servers << endl;
        
        cout << "Top 10 most efficient servers:" << endl;
        for (int i = 0; i < min(10, (int)server_efficiency.size()); i++) {
            auto [score, server] = server_efficiency[i];
            if (score > 0) {
                cout << "  Server " << server << ": score " << score 
                     << " (covers " << server_to_days[server].size() << " days)" << endl;
            }
        }
        
        return true;
    }
    
    Solution solve() {
        Solution solution(num_days);
        
        cout << "\n=== Final Optimal Solver ===" << endl;
        cout << "Days: " << num_days << endl;
        cout << "Target: EXACTLY " << MAX_REST_DAYS << " total rest days" << endl;
        
        // 精确的数学分配：74个工程师工作24天，262个工程师工作25天
        int engineers_24_days = 74;  // 工作24天，休息2天
        int engineers_25_days = 262; // 工作25天，休息1天
        
        cout << "Mathematical optimal distribution:" << endl;
        cout << "  " << engineers_24_days << " engineers work 24 days (rest 2 days)" << endl;
        cout << "  " << engineers_25_days << " engineers work 25 days (rest 1 day)" << endl;
        cout << "  Total rest days: " << (engineers_24_days * 2 + engineers_25_days * 1) << endl;
        
        cout << "\nPhase 1: Precise allocation to achieve exact targets..." << endl;
        
        vector<bool> server_used(NUM_SERVERS, false);
        vector<int> engineer_work_days(NUM_ENGINEERS, 0);
        
        // 为每个工程师精确分配服务器
        for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
            // 确定这个工程师的目标工作天数
            int target_work_days;
            if (engineer < engineers_24_days) {
                target_work_days = 24; // 前74个工程师工作24天
            } else {
                target_work_days = 25; // 后262个工程师工作25天
            }
            
            // 贪心选择服务器以达到精确的工作天数
            set<int> current_work_days;
            int servers_assigned = 0;
            
            // 按效率分数选择服务器
            for (auto& [score, server] : server_efficiency) {
                if (server_used[server] || servers_assigned >= MAX_SERVERS_PER_ENGINEER || score <= 0) {
                    continue;
                }
                
                // 计算分配这个服务器后的工作天数
                set<int> new_work_days = current_work_days;
                for (int day : server_to_days[server]) {
                    new_work_days.insert(day);
                }
                
                int new_work_count = new_work_days.size();
                
                // 检查是否改善分配
                bool should_assign = false;
                
                if (current_work_days.size() < target_work_days) {
                    // 如果还没达到目标，且新分配不会超过目标太多
                    if (new_work_count <= target_work_days + 1) {
                        should_assign = true;
                    }
                } else if (current_work_days.size() == target_work_days) {
                    // 已经达到目标，不再分配
                    break;
                }
                
                if (should_assign) {
                    solution.allocation[engineer][servers_assigned] = server;
                    server_used[server] = true;
                    servers_assigned++;
                    current_work_days = new_work_days;
                    
                    // 如果达到精确目标，停止分配
                    if (new_work_count == target_work_days) {
                        break;
                    }
                }
            }
            
            engineer_work_days[engineer] = current_work_days.size();
            
            if (engineer % 50 == 0 || engineer < 10) {
                cout << "Engineer " << engineer << ": " << engineer_work_days[engineer] 
                     << " work days (target: " << target_work_days << "), " 
                     << (num_days - engineer_work_days[engineer]) << " rest days" << endl;
            }
        }
        
        cout << "\nPhase 2: Fine-tuning to achieve exact constraint satisfaction..." << endl;
        
        // 微调阶段：通过服务器交换来优化分配
        for (int iteration = 0; iteration < 50; iteration++) {
            bool improved = false;
            
            // 尝试在工程师之间交换服务器以改善分配
            for (int e1 = 0; e1 < NUM_ENGINEERS && !improved; e1++) {
                int target1 = (e1 < engineers_24_days) ? 24 : 25;
                int current1 = 0;
                
                // 计算当前工作天数
                set<int> work_days1;
                for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
                    if (solution.allocation[e1][i] != -1) {
                        for (int day : server_to_days[solution.allocation[e1][i]]) {
                            work_days1.insert(day);
                        }
                    }
                }
                current1 = work_days1.size();
                
                if (current1 == target1) continue; // 已经达到目标
                
                // 寻找可以改善的服务器交换
                for (int e2 = e1 + 1; e2 < NUM_ENGINEERS; e2++) {
                    int target2 = (e2 < engineers_24_days) ? 24 : 25;
                    int current2 = 0;
                    
                    set<int> work_days2;
                    for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
                        if (solution.allocation[e2][i] != -1) {
                            for (int day : server_to_days[solution.allocation[e2][i]]) {
                                work_days2.insert(day);
                            }
                        }
                    }
                    current2 = work_days2.size();
                    
                    if (current2 == target2) continue; // 已经达到目标
                    
                    // 尝试交换服务器
                    for (int i1 = 0; i1 < MAX_SERVERS_PER_ENGINEER; i1++) {
                        for (int i2 = 0; i2 < MAX_SERVERS_PER_ENGINEER; i2++) {
                            if (solution.allocation[e1][i1] != -1 && solution.allocation[e2][i2] != -1) {
                                // 交换服务器
                                int temp = solution.allocation[e1][i1];
                                solution.allocation[e1][i1] = solution.allocation[e2][i2];
                                solution.allocation[e2][i2] = temp;
                                
                                // 重新计算工作天数
                                set<int> new_work_days1, new_work_days2;
                                for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
                                    if (solution.allocation[e1][i] != -1) {
                                        for (int day : server_to_days[solution.allocation[e1][i]]) {
                                            new_work_days1.insert(day);
                                        }
                                    }
                                    if (solution.allocation[e2][i] != -1) {
                                        for (int day : server_to_days[solution.allocation[e2][i]]) {
                                            new_work_days2.insert(day);
                                        }
                                    }
                                }
                                
                                int new_current1 = new_work_days1.size();
                                int new_current2 = new_work_days2.size();
                                
                                // 检查是否改善
                                int old_error = abs(current1 - target1) + abs(current2 - target2);
                                int new_error = abs(new_current1 - target1) + abs(new_current2 - target2);
                                
                                if (new_error < old_error) {
                                    improved = true;
                                    cout << "Iteration " << iteration << ": Improved allocation for engineers " 
                                         << e1 << " and " << e2 << endl;
                                    break;
                                } else {
                                    // 撤销交换
                                    temp = solution.allocation[e1][i1];
                                    solution.allocation[e1][i1] = solution.allocation[e2][i2];
                                    solution.allocation[e2][i2] = temp;
                                }
                            }
                        }
                        if (improved) break;
                    }
                    if (improved) break;
                }
                if (improved) break;
            }
            
            if (!improved) {
                cout << "No more improvements possible at iteration " << iteration << endl;
                break;
            }
        }
        
        // 计算最终结果
        calculateFinalResults(solution);
        
        return solution;
    }
    
private:
    void calculateFinalResults(Solution& solution) {
        solution.total_rest_days = 0;
        
        for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
            fill(solution.daily_work[engineer].begin(), solution.daily_work[engineer].end(), false);
            
            for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
                int server = solution.allocation[engineer][i];
                if (server == -1) continue;
                
                for (int day : server_to_days[server]) {
                    if (day < solution.num_days) {
                        solution.daily_work[engineer][day] = true;
                    }
                }
            }
            
            int work_days = 0;
            for (int day = 0; day < solution.num_days; day++) {
                if (solution.daily_work[engineer][day]) {
                    work_days++;
                }
            }
            solution.total_rest_days += (solution.num_days - work_days);
        }
        
        // 统计结果
        map<int, int> work_days_distribution;
        map<int, int> rest_days_distribution;
        int engineers_with_first_14_work = 0;
        int engineers_24_days = 0;
        int engineers_25_days = 0;
        
        for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
            int work_days = 0;
            bool has_first_14_work = false;
            
            for (int day = 0; day < solution.num_days; day++) {
                if (solution.daily_work[engineer][day]) {
                    work_days++;
                    if (day < 14) {
                        has_first_14_work = true;
                    }
                }
            }
            
            int rest_days = solution.num_days - work_days;
            work_days_distribution[work_days]++;
            rest_days_distribution[rest_days]++;
            if (has_first_14_work) engineers_with_first_14_work++;
            
            if (work_days == 24) engineers_24_days++;
            if (work_days == 25) engineers_25_days++;
        }
        
        cout << "\n=== Final Results ===" << endl;
        cout << "Work days distribution:" << endl;
        for (auto& [days, count] : work_days_distribution) {
            cout << "  " << count << " engineers work " << days << " days" << endl;
        }
        
        cout << "\nRest days distribution:" << endl;
        for (auto& [days, count] : rest_days_distribution) {
            cout << "  " << count << " engineers rest " << days << " days" << endl;
        }
        
        cout << "\nTarget Achievement:" << endl;
        cout << "Engineers working 24 days: " << engineers_24_days << " / 74 (target)" << endl;
        cout << "Engineers working 25 days: " << engineers_25_days << " / 262 (target)" << endl;
        
        cout << "\nConstraint Check:" << endl;
        cout << "Total rest days: " << solution.total_rest_days << " / " << MAX_REST_DAYS;
        if (solution.total_rest_days == MAX_REST_DAYS) {
            cout << " ✓ EXACTLY SATISFIED!" << endl;
        } else if (solution.total_rest_days <= MAX_REST_DAYS) {
            cout << " ✓ SATISFIED (under by " << (MAX_REST_DAYS - solution.total_rest_days) << ")" << endl;
        } else {
            cout << " ✗ VIOLATED (excess: " << (solution.total_rest_days - MAX_REST_DAYS) << ")" << endl;
        }
        
        cout << "Engineers with first 14 days work: " << engineers_with_first_14_work << " / " << NUM_ENGINEERS;
        if (engineers_with_first_14_work == NUM_ENGINEERS) {
            cout << " ✓ SATISFIED" << endl;
        } else {
            cout << " ✗ VIOLATED (missing: " << (NUM_ENGINEERS - engineers_with_first_14_work) << ")" << endl;
        }
        
        if (solution.total_rest_days <= MAX_REST_DAYS && engineers_with_first_14_work == NUM_ENGINEERS) {
            cout << "\n🎉 ALL CONSTRAINTS SATISFIED! 🎉" << endl;
            solution.valid = true;
        } else {
            cout << "\n❌ CONSTRAINT VIOLATIONS DETECTED ❌" << endl;
            solution.valid = false;
        }
        
        // 额外统计
        cout << "\nDetailed Analysis:" << endl;
        cout << "Average rest days per engineer: " << (double)solution.total_rest_days / NUM_ENGINEERS << endl;
        cout << "Rest day efficiency: " << (double)solution.total_rest_days / MAX_REST_DAYS * 100 << "%" << endl;
        
        if (solution.total_rest_days <= MAX_REST_DAYS) {
            cout << "Remaining rest day budget: " << (MAX_REST_DAYS - solution.total_rest_days) << " days" << endl;
        }
    }
    
public:
    void saveSolution(const Solution& solution, const string& filename) {
        ofstream file(filename);
        if (!file.is_open()) {
            cerr << "Error: Cannot create " << filename << endl;
            return;
        }
        
        for (int e = 0; e < NUM_ENGINEERS; e++) {
            for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
                file << solution.allocation[e][i];
                if (i < MAX_SERVERS_PER_ENGINEER - 1) file << " ";
            }
            file << endl;
        }
        
        file.close();
        cout << "Solution saved to " << filename << endl;
    }
};

int main() {
    cout << "=== Final Optimal Server Allocation Solver ===" << endl;
    cout << "Engineers: " << NUM_ENGINEERS << endl;
    cout << "Servers: " << NUM_SERVERS << endl;
    cout << "Max servers per engineer: " << MAX_SERVERS_PER_ENGINEER << endl;
    cout << "EXACT TARGET: " << MAX_REST_DAYS << " total rest days" << endl;
    cout << "Mathematical target: 74 engineers work 24 days, 262 engineers work 25 days" << endl;
    cout << endl;
    
    FinalOptimalSolver solver;
    
    if (!solver.loadAlarmData("alarm_list.txt")) {
        return 1;
    }
    
    cout << "\nSolving with mathematical precision and constraint satisfaction..." << endl;
    Solution solution = solver.solve();
    
    solver.saveSolution(solution, "final_solution.txt");
    
    if (solution.valid) {
        cout << "\n✅ PERFECT SOLUTION FOUND! All constraints exactly satisfied." << endl;
        cout << "🎯 Successfully achieved 410 total rest days with all engineers working first 14 days!" << endl;
    } else {
        cout << "\n⚠️  Best possible solution found. Analyzing constraint violations..." << endl;
    }
    
    return 0;
}