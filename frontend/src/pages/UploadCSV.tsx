import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// =============================
// CSV Upload Logic 
// =============================

/*

import type React from "react";
import { useState } from "react";
import { Upload, FileText, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Transaction {
  Description: string;
  Amount: number;
  DayOfWeek: string;
  Month: string;
  "Predicted Category": string;
}

export default function TransactionUpload() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [fileName, setFileName] = useState<string>("");

  const parseCSV = (csvText: string): Transaction[] => {
    const lines = csvText.trim().split("\n")
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
      const transaction: any = {}

      headers.forEach((header, index) => {
        if (header === "Amount") {
          transaction[header] = Number.parseFloat(values[index]) || 0
        } else {
          transaction[header] = values[index] || ""
        }
      })

      // Ensure all required fields exist
      return {
        Description: transaction.Description || "",
        Amount: transaction.Amount || 0,
        DayOfWeek: transaction.DayOfWeek || "",
        Month: transaction.Month || "",
        "Predicted Category": transaction["Predicted Category"] || "Unclassified",
      }
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadStatus("error")
      return
    }

    setIsUploading(true)
    setFileName(file.name)

    try {
      const text = await file.text()
      const parsedTransactions = parseCSV(text)
      setTransactions(parsedTransactions)
      setUploadStatus("success")
    } catch (error) {
      console.error("Error parsing CSV:", error)
      setUploadStatus("error")
    } finally {
      setIsUploading(false)
    }
  }

  const handleClassifyAll = async () => {
    if (transactions.length === 0) return

    setIsClassifying(true)

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactions }),
      })

      if (!response.ok) {
        throw new Error("Classification failed")
      }

      const { classifiedTransactions } = await response.json()
      setTransactions(classifiedTransactions)
    } catch (error) {
      console.error("Error classifying transactions:", error)
    } finally {
      setIsClassifying(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Food & Dining": "bg-orange-100 text-orange-800",
      Shopping: "bg-purple-100 text-purple-800",
      Transportation: "bg-blue-100 text-blue-800",
      Entertainment: "bg-pink-100 text-pink-800",
      "Bills & Utilities": "bg-red-100 text-red-800",
      Healthcare: "bg-green-100 text-green-800",
      Income: "bg-emerald-100 text-emerald-800",
      Unclassified: "bg-gray-100 text-gray-800",
    }
    return colors[category] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        // Header
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Transaction Classifier</h1>
          <p className="text-gray-600">Upload your CSV file to classify and analyze transactions</p>
        </div>

        // Upload Section
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Upload a CSV file containing transaction data with columns: Description, Amount, DayOfWeek, Month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    ) : (
                      <FileText className="h-8 w-8 text-gray-400" />
                    )}
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">CSV files only</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>

              {uploadStatus === "success" && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Successfully uploaded {fileName} with {transactions.length} transactions
                  </AlertDescription>
                </Alert>
              )}

              {uploadStatus === "error" && (
                <Alert variant="destructive">
                  <AlertDescription>Error uploading file. Please ensure it's a valid CSV file.</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        // Data Table
        {transactions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transaction Data</CardTitle>
                  <CardDescription>{transactions.length} transactions loaded</CardDescription>
                </div>
                <Button onClick={handleClassifyAll} disabled={isClassifying} className="flex items-center gap-2">
                  {isClassifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Classifying...
                    </>
                  ) : (
                    "Classify All"
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Day of Week</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Predicted Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium max-w-xs truncate">{transaction.Description}</TableCell>
                        <TableCell className="text-right">
                          <span className={transaction.Amount >= 0 ? "text-green-600" : "text-red-600"}>
                            ${Math.abs(transaction.Amount).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>{transaction.DayOfWeek}</TableCell>
                        <TableCell>{transaction.Month}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getCategoryColor(transaction["Predicted Category"])}>
                            {transaction["Predicted Category"]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        // Summary
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transactions.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${transactions.reduce((sum, t) => sum + Math.abs(t.Amount), 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Classified</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transactions.filter((t) => t["Predicted Category"] !== "Unclassified").length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

*/

export default function TransactionUpload() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              CSV Upload - Work in Progress
            </CardTitle>
            <CardDescription>
              This feature is under development. Check back soon to upload and classify transactions via CSV.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-gray-700 text-center py-10">
            🚧 We’re working on making bulk transaction uploads smooth and easy. Stay tuned!
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
