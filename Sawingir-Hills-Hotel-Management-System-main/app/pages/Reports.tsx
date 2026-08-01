import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { CalendarIcon, Download, BarChart3, TrendingUp, DollarSign, ShoppingCart, Users, Percent } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState } from "react";

type TabValue = "hotel-revenue" | "restaurant-sales";

const revenueData = [
  { month: "Jan", revenue: 2850000, rooms: 1240, adr: 4100 },
  { month: "Feb", revenue: 3120000, rooms: 1380, adr: 4250 },
  { month: "Mar", revenue: 3450000, rooms: 1520, adr: 4350 },
  { month: "Apr", revenue: 2980000, rooms: 1310, adr: 4080 },
  { month: "May", revenue: 3240000, rooms: 1420, adr: 4200 },
  { month: "Jun", revenue: 3680000, rooms: 1610, adr: 4450 },
];

const dailySalesData = [
  { date: "Mon", sales: 145000, orders: 45 },
  { date: "Tue", sales: 168000, orders: 52 },
  { date: "Wed", sales: 192000, orders: 61 },
  { date: "Thu", sales: 156000, orders: 48 },
  { date: "Fri", sales: 210000, orders: 68 },
  { date: "Sat", sales: 285000, orders: 89 },
  { date: "Sun", sales: 267000, orders: 82 },
];

const topSellingItems = [
  { name: "Grilled Chicken", quantity: 142, revenue: 205900 },
  { name: "Pasta Carbonara", quantity: 128, revenue: 192000 },
  { name: "Caesar Salad", quantity: 115, revenue: 143750 },
  { name: "Seafood Platter", quantity: 89, revenue: 222500 },
  { name: "Tiramisu", quantity: 156, revenue: 117000 },
];

const categorySalesData = [
  { name: "Main Course", value: 645000, color: "#2B0A57" },
  { name: "Appetizers", value: 285000, color: "#7C3AED" },
  { name: "Desserts", value: 178000, color: "#22C55E" },
  { name: "Beverages", value: 215000, color: "#F59E0B" },
];

const paymentMethodData = [
  { method: "Cash", amount: 425000, percentage: 33 },
  { method: "Credit Card", amount: 612000, percentage: 47 },
  { method: "Room Charge", amount: 286000, percentage: 20 },
];

export function Reports() {
  const [activeTab, setActiveTab] = useState<TabValue>("hotel-revenue");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const tabs = [
    { value: "hotel-revenue" as const, label: "Hotel Revenue" },
    { value: "restaurant-sales" as const, label: "Restaurant Sales" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Financial performance and business insights</p>
        </div>
        <Button className="bg-[#2B0A57] hover:bg-[#2B0A57]/90">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Horizontal Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-all duration-200 ${
                  isActive
                    ? "border-[#2B0A57] text-[#2B0A57]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content with Animation */}
      <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "hotel-revenue" && (
          <div className="space-y-6">

          {/* Date Range Filter */}
          <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : "From Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : "To Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
              </PopoverContent>
            </Popover>
            <Button className="bg-[#7C3AED]">Apply Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">19.32M</div>
            <p className="text-xs text-green-600 mt-1">↑ 15.3% vs last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">ADR (Avg Daily Rate)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4,238</div>
            <p className="text-xs text-gray-500 mt-1">LKR</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Occupancy Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.5%</div>
            <p className="text-xs text-green-600 mt-1">↑ 5.2% vs last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">RevPAR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,708</div>
            <p className="text-xs text-gray-500 mt-1">LKR</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Daily Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
                <Bar dataKey="adr" fill="#22C55E" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
          </div>
        </div>
        )}

        {activeTab === "restaurant-sales" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Today's Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <div className="text-2xl font-bold">267,000</div>
                  </div>
                  <p className="text-xs text-green-600 mt-1">↑ 12.5% vs yesterday</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-gray-500" />
                    <div className="text-2xl font-bold">82</div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Active orders: 5</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Avg Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <div className="text-2xl font-bold">3,256</div>
                  </div>
                  <p className="text-xs text-green-600 mt-1">↑ 8.2% vs last week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Weekly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gray-500" />
                    <div className="text-2xl font-bold">1.52M</div>
                  </div>
                  <p className="text-xs text-green-600 mt-1">↑ 15.3% vs last week</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Daily Sales Trend</CardTitle>
                    <Select defaultValue="week">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailySalesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="sales" fill="#2B0A57" radius={[8, 8, 0, 0]} name="Sales (LKR)" />
                      <Bar dataKey="orders" fill="#7C3AED" radius={[8, 8, 0, 0]} name="Orders" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sales by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categorySalesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categorySalesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topSellingItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0
                                ? "bg-yellow-100 text-yellow-700"
                                : index === 1
                                ? "bg-gray-100 text-gray-700"
                                : index === 2
                                ? "bg-orange-100 text-orange-700"
                                : "bg-violet-100 text-violet-700"
                            }`}
                          >
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">{item.quantity} sold</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            LKR {item.revenue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {paymentMethodData.map((payment, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {payment.method}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            LKR {payment.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#2B0A57] h-2 rounded-full"
                            style={{ width: `${payment.percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            {payment.percentage}% of total
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

