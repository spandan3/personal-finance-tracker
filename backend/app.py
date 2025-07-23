from flask import Flask, request, jsonify
from flask_cors import CORS
from fastai.tabular.all import load_learner
import pandas as pd
import os
import psycopg2
from datetime import datetime
from dotenv import load_dotenv 

load_dotenv() 

app = Flask(__name__)
CORS(app, supports_credentials=True)

# === Load FastAI model ===
MODEL_PATH = os.path.join("ml", "model.pkl")
learn = load_learner(MODEL_PATH)

# === Database Connection (Postgres/Supabase) ===
conn = psycopg2.connect(
    host=os.environ.get("DB_HOST"),
    database=os.environ.get("DB_NAME"),
    user=os.environ.get("DB_USER"),
    password=os.environ.get("DB_PASSWORD"),
    port=5432
)
cur = conn.cursor()

@app.route("/")
def home():
    return jsonify({"message": "Backend running with ML model!"})

@app.route("/predict", methods=["POST"])
def predict_transaction():
    data = request.get_json()

    # Extract required fields
    description = data.get("description")
    amount = float(data.get("amount", 0))
    date = data.get("date", datetime.now().strftime("%Y-%m-%d"))
    user_id = data.get("user_id", None)  

    if not description:
        return jsonify({"error": "Description is required"}), 400

    # Create a dataframe for prediction
    pred_class, pred_idx, probs = learn.predict(description)
    predicted_category = str(pred_class)
    confidence = round(float(probs[pred_idx]) * 100, 2)

    # Only save to database if user is logged in
    if user_id:
        try:
            cur.execute(
                """
                INSERT INTO transactions (user_id, description, amount, predicted_category, date, confidence)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (user_id, description, amount, predicted_category, date, confidence)
            )
            conn.commit()
        except Exception as e:
            print("Database insert error:", e)
            conn.rollback()

    return jsonify({
        "predicted_category": predicted_category,
        "confidence": confidence
    })

if __name__ == "__main__":
    app.run(debug=True)
