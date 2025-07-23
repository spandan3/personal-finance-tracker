import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, DollarSign, Calendar, Tag, TrendingUp } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

interface PredictionResult {
  category: string
  confidence: number
}

interface FormData {
  description: string
  amount: string
  date: string
}

export default function TransactionPredictor() {
  const [formData, setFormData] = useState<FormData>({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  })

  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        setUserId(data.user.id)
      } else {
        setUserId(null)
      }
    }
    checkUser()
  }, [])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear previous results when form changes
    if (prediction) {
      setPrediction(null)
    }
    if (error) {
      setError(null)
    }
  }

  const handlePredict = async () => {
    if (!formData.description.trim()) {
      setError("Please enter a transaction description")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: formData.description,
          amount: Number(formData.amount),
          date: formData.date,
          user_id: userId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setPrediction({
        category: result.predicted_category,  
        confidence: result.confidence
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to predict category. Please check if the API server is running.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const formatAmount = (amount: string) => {
    const num = Number.parseFloat(amount)
    return isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 pt-8">
          <h1 className="text-4xl font-bold text-slate-900">Transaction Predictor</h1>
          <p className="text-slate-600 text-lg">AI-powered category prediction for your financial transactions</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form Card */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-emerald-600" />
                Transaction Details
              </CardTitle>
              <CardDescription>Enter your transaction information to predict its category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Description
                </Label>
                <Input
                  id="description"
                  placeholder="e.g., Starbucks coffee, Gas station, Grocery store"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-slate-500">Describe what the transaction was for</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium text-slate-700">
                  Amount (CAD)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium text-slate-700">
                  Date
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <Button
                onClick={handlePredict}
                disabled={isLoading || !formData.description.trim()}
                className="w-full h-12 text-base font-medium bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Predicting...
                  </>
                ) : (
                  <>
                    <Tag className="mr-2 h-4 w-4" />
                    Predict Category
                  </>
                )}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card
            className={`shadow-lg border-0 transition-all duration-300 ${
              prediction ? "bg-white" : "bg-slate-50 border-dashed border-2 border-slate-200"
            }`}
          >
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                Prediction Results
              </CardTitle>
              <CardDescription>
                {prediction ? "AI-generated category prediction" : "Results will appear here after prediction"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {prediction ? (
                <div className="space-y-6">
                  {/* Prediction Results */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Predicted Category</Label>
                        <p className="text-2xl font-bold text-blue-900 mt-1">{prediction.category}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Confidence</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${prediction.confidence}%` }}
                            />
                          </div>
                          <span className="text-lg font-semibold text-blue-900">
                            {prediction.confidence.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Context */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900">Transaction Context</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-slate-50 rounded-lg p-4">
                        <Label className="text-sm font-medium text-slate-600">Description</Label>
                        <p className="text-slate-900 mt-1 font-medium">{formData.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                          <Label className="text-sm font-medium text-slate-600">Amount</Label>
                          <p className="text-slate-900 mt-1 font-bold text-lg">{formatAmount(formData.amount)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4">
                          <Label className="text-sm font-medium text-slate-600">Date</Label>
                          <p className="text-slate-900 mt-1 font-medium">{formatDate(formData.date)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Tag className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-lg">No prediction yet</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Fill out the form and click "Predict Category" to see results
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-500 text-sm pb-8">
          <p>Powered by AI • Secure • Fast • Accurate</p>
        </div>
      </div>
    </div>
  )
}
