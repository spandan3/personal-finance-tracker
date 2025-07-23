import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp, CreditCard } from "lucide-react";

// Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface Transaction {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

// Dummy data (used if user not logged in)
const dummySummary = {
  totalSpent: 3273.05,
  topCategory: "housing",
  totalTransactions: 45,
};

const dummyCategoryData = [
  { name: "housing", value: 1200.0, color: "#3b82f6" },
  { name: "food", value: 650.45, color: "#ef4444" },
  { name: "transportation", value: 420.78, color: "#10b981" },
  { name: "healthcare", value: 280.5, color: "#f59e0b" },
  { name: "shopping", value: 345.67, color: "#8b5cf6" },
  { name: "entertainment", value: 180.25, color: "#06b6d4" },
  { name: "miscellaneous", value: 195.4, color: "#6b7280" },
];

const dummyTransactions = [
  { id: 1, description: "Rent Payment", amount: -1200.0, category: "housing", date: "2024-01-15" },
  { id: 2, description: "Grocery Shopping", amount: -89.45, category: "food", date: "2024-01-14" },
  { id: 3, description: "Gas Station", amount: -45.3, category: "transportation", date: "2024-01-14" },
  { id: 4, description: "Doctor Visit", amount: -150.0, category: "healthcare", date: "2024-01-13" },
  { id: 5, description: "Movie Theater", amount: -24.5, category: "entertainment", date: "2024-01-12" },
  { id: 6, description: "Clothing Store", amount: -75.2, category: "shopping", date: "2024-01-11" },
  { id: 7, description: "Coffee Shop", amount: -12.45, category: "food", date: "2024-01-11" },
  { id: 8, description: "Uber Ride", amount: -18.3, category: "transportation", date: "2024-01-10" },
  { id: 9, description: "Pharmacy", amount: -35.75, category: "healthcare", date: "2024-01-10" },
  { id: 10, description: "Office Supplies", amount: -42.15, category: "miscellaneous", date: "2024-01-09" },
];

const chartConfig = {
  spending: {
    label: "Spending",
  },
  housing: {
    label: "Housing",
    color: "#3b82f6",
  },
  food: {
    label: "Food",
    color: "#ef4444",
  },
  transportation: {
    label: "Transportation",
    color: "#10b981",
  },
  healthcare: {
    label: "Healthcare",
    color: "#f59e0b",
  },
  shopping: {
    label: "Shopping",
    color: "#8b5cf6",
  },
  entertainment: {
    label: "Entertainment",
    color: "#06b6d4",
  },
  miscellaneous: {
    label: "Miscellaneous",
    color: "#6b7280",
  },
}

function getCategoryColor(category: string) {
  const colors: { [key: string]: string } = {
    housing: "bg-blue-100 text-blue-800",
    food: "bg-red-100 text-red-800",
    transportation: "bg-green-100 text-green-800",
    healthcare: "bg-yellow-100 text-yellow-800",
    shopping: "bg-purple-100 text-purple-800",
    entertainment: "bg-cyan-100 text-cyan-800",
    miscellaneous: "bg-gray-100 text-gray-800",
  }
  return colors[category] || "bg-gray-100 text-gray-800"
}

export default function FinanceDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Check user login
      const { data: authData } = await supabase.auth.getUser();
      // console.log("Auth user:", authData.user.id);
      if (!authData.user) {
        setUserLoggedIn(false);
        setLoading(false);
        return;
      }

      setUserLoggedIn(true);

      // Fetch transactions for logged-in user
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", authData.user.id)
        .order("date", { ascending: false });
      // console.log("Fetched Transactions:", data);

      if (!error && data) {
        const transformed = data.map((t: any) => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        category: t.predicted_category, 
        date: t.date,
        }));

        setTransactions(transformed as Transaction[]);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  
  // If logged in but no data
  if (userLoggedIn && !loading && transactions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full text-center shadow-lg p-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">No Transactions Yet</CardTitle>
            <CardDescription>Add your first transaction using the Predict Transaction page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const usingDummy = !userLoggedIn || transactions.length === 0;

  const displayTransactions = transactions.length > 0 ? transactions : dummyTransactions;
  // console.log("Displaying Transactions:", displayTransactions);

  const totalSpent = usingDummy
    ? dummySummary.totalSpent
    : displayTransactions.reduce((sum, t) => sum + t.amount, 0);

  const topCategory = usingDummy
    ? dummySummary.topCategory
    : Object.entries(
        displayTransactions.reduce((acc: any, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {})
      ).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "N/A";
    
  const totalTransactions = usingDummy ? dummySummary.totalTransactions : displayTransactions.length;
  
  interface CategoryData {
    name: string;
    value: number;
    color: string;
  }

  const categoryData: CategoryData[] = usingDummy
    ? dummyCategoryData
    : Object.entries(
        displayTransactions.reduce((acc: any, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {})
      ).map(([name, value], i) => ({
        name,
        value: value as number,
        color: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#6b7280"][i % 7],
      }));

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Personal Finance Dashboard</h1>
          <p className="text-gray-600">Track your spending and manage your finances</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">${totalSpent.toFixed(2).toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Top Category</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{topCategory}</div>
              <p className="text-xs text-gray-500 mt-1">Highest spending</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalTransactions}</div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Transactions */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Pie Chart */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Spending by Category</CardTitle>
              <CardDescription className="text-gray-600">Breakdown of your expenses this month</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value) => ["Amount: ",`$${Number(value).toFixed(2)}`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>

              {/* Legend */}
              <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
                {categoryData.map((category) => (
                  <div key={category.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                    <span className="text-gray-600 truncate">{category.name}</span>
                    <span className="ml-auto font-medium text-gray-900">${category.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Transactions</CardTitle>
              <CardDescription className="text-gray-600">
                 {usingDummy ? "Sample data shown for guests" : "Your latest spending activity"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="text-gray-600 font-medium">Description</TableHead>
                      <TableHead className="text-gray-600 font-medium">Amount</TableHead>
                      <TableHead className="text-gray-600 font-medium">Category</TableHead>
                      <TableHead className="text-gray-600 font-medium">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayTransactions.slice(0, 10).map((t) => (
                      <TableRow key={t.id} className="border-gray-100">
                        <TableCell className="font-medium text-gray-900">{t.description}</TableCell>
                        <TableCell className="font-semibold text-red-600">
                          ${Math.abs(t.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${getCategoryColor(t.category)} border-0`}>
                            {t.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(t.date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
