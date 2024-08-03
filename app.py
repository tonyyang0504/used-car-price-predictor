from flask import Flask, render_template, request, jsonify, send_from_directory
import pandas as pd
import numpy as np
import joblib
import json
from datetime import datetime
import logging
import traceback
import math
import os


app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

app.static_folder = 'static'

global model
model = None

try:
    model = joblib.load(
        "./models/['Age', 'Kilometers', 'Make', 'Model', 'Trim', 'Regional Specs', 'Age_Kilometers', 'Kilometers_per_Year']_best_xgb_new.joblib")
    app.logger.info("Model loaded successfully")
except Exception as e:
    app.logger.error(f"Error loading model: {e}")


@app.route('/value-your-car', methods=['GET', 'POST'])
def value_your_car():
    try:
        options, filtering_rules = load_data_and_options()
    except Exception as e:
        app.logger.error(f"Error loading data and options: {str(e)}")
        return jsonify({"success": False, "error": "Unable to load necessary data. Please try again later."}), 500

    if request.method == 'GET':
        return render_template('value_your_car.html',
                               options=options,
                               filtering_rules=json.dumps(filtering_rules),
                               year_range=generate_year_range())
    elif request.method == 'POST':
        try:
            user_input = {}
            features = ['Make', 'Model', 'Kilometers', 'Year', 'Regional Specs', 'Trim']

            for feature in features:
                user_input[feature] = request.form.get(feature, '')
                if not user_input[feature]:
                    return jsonify({"success": False, "error": f"Missing required field: {feature}"}), 400

            input_df = pd.DataFrame([user_input])

            # Convert numeric fields with error handling
            try:
                input_df['Kilometers'] = pd.to_numeric(input_df['Kilometers'], errors='coerce')
                input_df['Year'] = pd.to_numeric(input_df['Year'], errors='coerce')

                # Check for NaN values after conversion
                if input_df['Kilometers'].isna().any() or input_df['Year'].isna().any():
                    raise ValueError("Invalid numeric input for Kilometers or Year")

                # Ensure Year is an integer
                input_df['Year'] = input_df['Year'].astype('int64')
            except ValueError as ve:
                app.logger.error(f"Numeric conversion error: {str(ve)}")
                return jsonify({"success": False, "error": f"Invalid numeric input: {str(ve)}"}), 400

            # Calculate Age from Year
            current_year = datetime.now().year
            input_df['Age'] = current_year - input_df['Year']

            # Calculate new features
            input_df['Age_Kilometers'] = input_df['Age'] * input_df['Kilometers']
            input_df['Kilometers_per_Year'] = input_df['Kilometers'] / input_df['Age'].replace(0, 1)

            # Ensure all categorical variables are strings
            categorical_columns = [col for col in features if col not in ['Kilometers', 'Year']]
            for col in categorical_columns:
                input_df[col] = input_df[col].astype(str)

            # Validate input
            input_df = validate_input(input_df, options)

            # Handle Unknown Trim
            if input_df['Trim'].iloc[0] == 'Unknown':
                # Load sold out cars data
                sold_out_df = pd.read_csv("./car_data/dubizzle_cars_sold_out.csv")

                # Filter for the same make and model
                relevant_cars = sold_out_df[
                    (sold_out_df['Make'] == input_df['Make'].iloc[0]) &
                    (sold_out_df['Model'] == input_df['Model'].iloc[0])
                ]

                if relevant_cars.empty:
                    return jsonify(
                        {"success": False, "error": "No data available for this make and model combination."})

                # Get unique trims
                trims = relevant_cars['Trim'].unique()

                trim_predictions = {}
                predictions = []
                for trim in trims:
                    trim_input = input_df.copy()
                    trim_input['Trim'] = trim

                    # Select only the features required by the model
                    model_features = ['Age', 'Kilometers', 'Make', 'Model', 'Trim', 'Regional Specs', 'Age_Kilometers',
                                      'Kilometers_per_Year']
                    trim_input_model = trim_input[model_features]

                    trim_input_model = preprocess_dataframe(trim_input_model)

                    prediction = model.predict(trim_input_model)[0]
                    predictions.append(prediction)
                    trim_predictions[trim] = f"AED {round(prediction):,}"

                min_prediction = min(predictions)
                max_prediction = max(predictions)
                prediction = f"AED {round(min_prediction):,} - {round(max_prediction):,}"
            else:
                # Select only the features required by the model
                model_features = ['Age', 'Kilometers', 'Make', 'Model', 'Trim', 'Regional Specs', 'Age_Kilometers',
                                  'Kilometers_per_Year']
                input_df_model = input_df[model_features]

                input_df_model = preprocess_dataframe(input_df_model)
                app.logger.info(f"Processed input data: {input_df_model.to_dict()}")

                prediction = model.predict(input_df_model)[0]
                prediction = f"AED {round(prediction):,}"
                trim_predictions = None

            # Fetch similar cars for sale
            cars_for_sale_df = pd.read_csv("./car_data/cars_for_sale.csv", dtype=str)
            cars_for_sale_df['Year'] = pd.to_numeric(cars_for_sale_df['Year'], errors='coerce').astype('int64')
            cars_for_sale_df['Price'] = pd.to_numeric(cars_for_sale_df['Price'], errors='coerce')
            cars_for_sale_df['Kilometers'] = pd.to_numeric(cars_for_sale_df['Kilometers'], errors='coerce')

            filtered_cars = cars_for_sale_df[
                (cars_for_sale_df['Make'] == user_input['Make']) &
                (cars_for_sale_df['Model'] == user_input['Model']) &
                (cars_for_sale_df['Year'] == input_df['Year'].iloc[0])
            ]

            app.logger.info(f"Found {len(filtered_cars)} similar cars for sale")

            # Fetch similar sold-out cars
            sold_out_df = pd.read_csv("./car_data/dubizzle_cars_sold_out.csv", dtype=str)
            sold_out_df['Year'] = pd.to_numeric(sold_out_df['Year'], errors='coerce').astype('int64')
            sold_out_df['Price'] = pd.to_numeric(sold_out_df['Price'], errors='coerce')
            sold_out_df['Kilometers'] = pd.to_numeric(sold_out_df['Kilometers'], errors='coerce')

            filtered_sold_out = sold_out_df[
                (sold_out_df['Make'] == user_input['Make']) &
                (sold_out_df['Model'] == user_input['Model']) &
                (sold_out_df['Year'] == input_df['Year'].iloc[0])
            ]

            app.logger.info(f"Found {len(filtered_sold_out)} similar sold-out cars")

            # Prepare filtered cars data
            filtered_cars = preprocess_dataframe(filtered_cars)
            filtered_cars_list = filtered_cars.to_dict('records')
            for car in filtered_cars_list:
                car['Price'] = int(float(car['Price'])) if car['Price'] else None
                car['Kilometers'] = int(float(car['Kilometers'])) if car['Kilometers'] is not None else None
                car['Year'] = int(car['Year']) if car['Year'] else None
                car['Regional Specs'] = car.get('Regional Specs', 'N/A')
                car['Seller Type'] = car.get('Seller Type', 'N/A')
                car['Posted Date'] = car.get('Posted Datetime', 'N/A')
                car['Source'] = car.get('Source', 'N/A')

            # Prepare filtered sold-out cars data
            filtered_sold_out = preprocess_dataframe(filtered_sold_out)
            sold_out_list = filtered_sold_out.to_dict('records')
            for car in sold_out_list:
                car['Price'] = int(float(car['Price'])) if car['Price'] else None
                car['Kilometers'] = int(float(car['Kilometers'])) if car['Kilometers'] is not None else None
                car['Year'] = int(car['Year']) if car['Year'] else None
                car['Regional Specs'] = car.get('Regional Specs', 'N/A')
                car['Seller Type'] = car.get('Seller Type', 'N/A')
                car['Posted Date'] = car.get('Posted Datetime', 'N/A')
                car['Source'] = car.get('Source', 'N/A')

            response_data = {
                "success": True,
                "prediction": prediction,
                "car_info": user_input,
                "similar_cars": filtered_cars_list,
                "sold_out_cars": sold_out_list,
                "trim_predictions": trim_predictions
            }

            return jsonify(response_data)

        except Exception as e:
            app.logger.error(f"Prediction error: {str(e)}")
            app.logger.error(traceback.format_exc())
            return jsonify({"success": False, "error": f"Unable to make prediction: {str(e)}"}), 500


@app.route('/cars-for-sale')
def cars_for_sale():
    return render_template('cars_for_sale.html')


@app.route('/auction-cars')
def auction_cars():
    return render_template('auction_cars.html')


@app.route('/undervalued-cars')
def undervalued_cars():
    try:
        cars_predicted_df = pd.read_csv("./car_data/cars_predicted.csv", dtype=str)
        cars_predicted_df = cars_predicted_df.drop_duplicates(subset=['id'], keep='last', ignore_index=True)

        cars_predicted_df['Year'] = pd.to_numeric(cars_predicted_df['Year'], errors='coerce').astype('int64')
        numeric_fields = ['Kilometers', 'Price', 'Predicted_Price', 'price/expected_price']
        for field in numeric_fields:
            cars_predicted_df[field] = pd.to_numeric(cars_predicted_df[field], errors='coerce')

        underpriced_cars_df = cars_predicted_df[cars_predicted_df['Price'] > 0]
        undervalued_cars_df = underpriced_cars_df[
            (cars_predicted_df['price/expected_price'] < 1) & (cars_predicted_df['price/expected_price'] > 0)]

        undervalued_cars_df = preprocess_dataframe(undervalued_cars_df)
        undervalued_cars = undervalued_cars_df[
            ['Make', 'Model', 'Year', 'Kilometers', 'Regional Specs', 'Price', 'Predicted_Price',
             'price/expected_price', 'Seller Type', 'Posted Datetime', 'Source', 'permalink']].to_dict(orient='records')

        year_range = generate_year_range(undervalued_cars_df)

        return render_template('undervalued_cars.html',
                               undervalued_cars=json.dumps(undervalued_cars),
                               year_range=json.dumps(year_range))
    except Exception as e:
        app.logger.error(f"Error in undervalued cars: {str(e)}")
        app.logger.error(traceback.format_exc())
        return render_template('undervalued_cars.html', error=str(e))


@app.route('/used-car-market-insights')
def used_car_market_insights():
    return render_template('used_car_market_insights.html')


@app.route('/static/js/<path:filename>')
def serve_static_js(filename):
    return send_from_directory(os.path.join(app.root_path, 'static', 'js'), filename, mimetype='application/javascript')


class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj) if not np.isnan(obj) else None
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if pd.isna(obj):
            return None
        return super(NpEncoder, self).default(obj)


def preprocess_dataframe(df):
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.where(pd.notnull(df), None)

    float_columns = df.select_dtypes(include=['float64']).columns
    for col in float_columns:
        df[col] = df[col].apply(lambda x: f"{x:.2f}" if x is not None else None)

    return df


def format_value(value):
    if value is None or pd.isna(value) or (isinstance(value, float) and math.isinf(value)):
        return 'N/A'
    if isinstance(value, (int, float)):
        if isinstance(value, float) and value.is_integer():
            return f"{int(value):,}"
        return f"{value:,}"
    return str(value)


def generate_year_range(df=None):
    if df is not None and 'Year' in df.columns:
        df['Year'] = pd.to_numeric(df['Year'], errors='coerce').astype('int64')
        start_year = df['Year'].min()
        current_year = df['Year'].max()
    else:
        start_year = 1990
        current_year = datetime.now().year
    return list(range(current_year, start_year - 1, -1))


def load_data_and_options():
    try:
        df = pd.read_csv('./car_data/dubizzle_cars_sold_out.csv', dtype=str)
        features = ['Make', 'Model', 'Trim', 'Regional Specs']
        df = df[features]

        options = {column: sorted(df[column].dropna().unique().tolist()) for column in features}
        options['Trim'] = ['Unknown'] + [trim for trim in options['Trim'] if trim != 'Unknown']

        filtering_rules = {}
        for make in options['Make']:
            make_df = df[df['Make'] == make]
            filtering_rules[make] = {
                'Model': sorted(make_df['Model'].unique().tolist()),
                'Trim': {},
                'Regional Specs': sorted(make_df['Regional Specs'].unique().tolist())
            }
            for model in filtering_rules[make]['Model']:
                model_df = make_df[make_df['Model'] == model]
                trim_list = [str(trim) for trim in model_df['Trim'].unique().tolist()]
                filtering_rules[make]['Trim'][model] = sorted(trim_list)

        return options, filtering_rules
    except Exception as e:
        app.logger.error(f"Error loading data: {e}")
        return {}, {}

options, filtering_rules = load_data_and_options()


def validate_input(input_df, options):
    for column, valid_options in options.items():
        if column in input_df.columns:
            if input_df[column].iloc[0] not in valid_options:
                input_df.at[0, column] = 'Unknown'
    return input_df


@app.route('/', methods=['GET', 'POST'])
def home():
    if request.method == 'GET':
        year_range = generate_year_range()
        return render_template('index.html',
                               features=['Make', 'Model', 'Kilometers', 'Year', 'Regional Specs', 'Trim'],
                               options=options,
                               filtering_rules=json.dumps(filtering_rules),
                               year_range=year_range)
    elif request.method == 'POST':
        try:
            user_input = {}
            features = ['Make', 'Model', 'Kilometers', 'Year', 'Regional Specs', 'Trim']

            for feature in features:
                user_input[feature] = request.form.get(feature, '')

            input_df = pd.DataFrame([user_input])

            # Convert numeric fields
            input_df['Kilometers'] = pd.to_numeric(input_df['Kilometers'], errors='coerce')
            input_df['Year'] = pd.to_numeric(input_df['Year'], errors='coerce').astype('int64')

            # Calculate Age from Year
            current_year = datetime.now().year
            input_df['Age'] = current_year - input_df['Year']

            # Calculate new features
            input_df['Age_Kilometers'] = input_df['Age'] * input_df['Kilometers']
            input_df['Kilometers_per_Year'] = input_df['Kilometers'] / input_df['Age'].replace(0, 1)

            # Ensure all categorical variables are strings
            categorical_columns = [col for col in features if col not in ['Kilometers', 'Year']]
            for col in categorical_columns:
                input_df[col] = input_df[col].astype(str)

            # Validate input
            input_df = validate_input(input_df, options)

            # Handle Unknown Trim
            if input_df['Trim'].iloc[0] == 'Unknown':
                # Load sold out cars data
                sold_out_df = pd.read_csv("./car_data/dubizzle_cars_sold_out.csv")

                # Filter for the same make and model
                relevant_cars = sold_out_df[
                    (sold_out_df['Make'] == input_df['Make'].iloc[0]) &
                    (sold_out_df['Model'] == input_df['Model'].iloc[0])
                ]

                if relevant_cars.empty:
                    return jsonify({"success": False, "error": "No data available for this make and model combination."})

                # Get unique trims
                trims = relevant_cars['Trim'].unique()

                trim_predictions = {}
                predictions = []
                for trim in trims:
                    trim_input = input_df.copy()
                    trim_input['Trim'] = trim

                    # Select only the features required by the model
                    model_features = ['Age', 'Kilometers', 'Make', 'Model', 'Trim', 'Regional Specs', 'Age_Kilometers', 'Kilometers_per_Year']
                    trim_input_model = trim_input[model_features]

                    trim_input_model = preprocess_dataframe(trim_input_model)

                    prediction = model.predict(trim_input_model)[0]
                    predictions.append(prediction)
                    trim_predictions[trim] = f"AED {round(prediction):,}"

                min_prediction = min(predictions)
                max_prediction = max(predictions)
                prediction = f"AED {round(min_prediction):,} - {round(max_prediction):,}"
            else:
                # Select only the features required by the model
                model_features = ['Age', 'Kilometers', 'Make', 'Model', 'Trim', 'Regional Specs', 'Age_Kilometers', 'Kilometers_per_Year']
                input_df_model = input_df[model_features]

                input_df_model = preprocess_dataframe(input_df_model)
                app.logger.info(f"Processed input data: {input_df_model.to_dict()}")

                prediction = model.predict(input_df_model)[0]
                prediction = f"AED {round(prediction):,}"
                trim_predictions = None

            # Fetch similar cars for sale
            cars_for_sale_df = pd.read_csv("./car_data/cars_for_sale.csv", dtype=str)
            cars_for_sale_df['Year'] = pd.to_numeric(cars_for_sale_df['Year'], errors='coerce').astype('int64')
            cars_for_sale_df['Price'] = pd.to_numeric(cars_for_sale_df['Price'], errors='coerce')
            cars_for_sale_df['Kilometers'] = pd.to_numeric(cars_for_sale_df['Kilometers'], errors='coerce')

            filtered_cars = cars_for_sale_df[
                (cars_for_sale_df['Make'] == user_input['Make']) &
                (cars_for_sale_df['Model'] == user_input['Model']) &
                (cars_for_sale_df['Year'] == input_df['Year'].iloc[0])
            ]

            app.logger.info(f"Found {len(filtered_cars)} similar cars for sale")

            # Fetch similar sold-out cars
            sold_out_df = pd.read_csv("./car_data/dubizzle_cars_sold_out.csv", dtype=str)
            sold_out_df['Year'] = pd.to_numeric(sold_out_df['Year'], errors='coerce').astype('int64')
            sold_out_df['Price'] = pd.to_numeric(sold_out_df['Price'], errors='coerce')
            sold_out_df['Kilometers'] = pd.to_numeric(sold_out_df['Kilometers'], errors='coerce')

            filtered_sold_out = sold_out_df[
                (sold_out_df['Make'] == user_input['Make']) &
                (sold_out_df['Model'] == user_input['Model']) &
                (sold_out_df['Year'] == input_df['Year'].iloc[0])
            ]

            app.logger.info(f"Found {len(filtered_sold_out)} similar sold-out cars")

            # Prepare filtered cars data
            filtered_cars = preprocess_dataframe(filtered_cars)
            filtered_cars_list = filtered_cars.to_dict('records')
            for car in filtered_cars_list:
                car['Price'] = int(float(car['Price'])) if car['Price'] else None
                car['Kilometers'] = int(float(car['Kilometers'])) if car['Kilometers'] is not None else None
                car['Year'] = int(car['Year']) if car['Year'] else None
                car['Regional Specs'] = car.get('Regional Specs', 'N/A')
                car['Seller Type'] = car.get('Seller Type', 'N/A')
                car['Posted Date'] = car.get('Posted Datetime', 'N/A')
                car['Source'] = car.get('Source', 'N/A')

            # Prepare filtered sold-out cars data
            filtered_sold_out = preprocess_dataframe(filtered_sold_out)
            sold_out_list = filtered_sold_out.to_dict('records')
            for car in sold_out_list:
                car['Price'] = int(float(car['Price'])) if car['Price'] else None
                car['Kilometers'] = int(float(car['Kilometers'])) if car['Kilometers'] is not None else None
                car['Year'] = int(car['Year']) if car['Year'] else None
                car['Regional Specs'] = car.get('Regional Specs', 'N/A')
                car['Seller Type'] = car.get('Seller Type', 'N/A')
                car['Posted Date'] = car.get('Posted Datetime', 'N/A')
                car['Source'] = car.get('Source', 'N/A')

            response_data = {
                "success": True,
                "prediction": prediction,
                "car_info": user_input,
                "similar_cars": filtered_cars_list,
                "sold_out_cars": sold_out_list,
                "trim_predictions": trim_predictions
            }

            return jsonify(response_data)

        except Exception as e:
            app.logger.error(f"Prediction error: {str(e)}")
            app.logger.error(traceback.format_exc())
            return jsonify({"success": False, "error": f"Unable to make prediction: {str(e)}"}), 500


@app.route('/get-cars-for-sale')
def get_cars_for_sale():
    try:
        cars_for_sale_df = pd.read_csv("./car_data/cars_for_sale.csv", dtype=str)
        cars_for_sale_df = cars_for_sale_df.drop_duplicates(subset=['id'], keep='last', ignore_index=True)
        cars_for_sale_df = cars_for_sale_df[['Make', 'Model', 'Year', 'Kilometers', 'Regional Specs',
                                             'Price', 'Seller Type', 'Posted Datetime', 'Source', 'permalink']]

        numeric_fields = ['Kilometers', 'Year', 'Price']
        for field in numeric_fields:
            cars_for_sale_df[field] = pd.to_numeric(cars_for_sale_df[field], errors='coerce')

        cars_for_sale_df['Year'] = pd.to_numeric(cars_for_sale_df['Year'], errors='coerce').astype('int64')

        cars_for_sale_df = cars_for_sale_df[cars_for_sale_df['Price'] > 0]
        cars_for_sale_df = preprocess_dataframe(cars_for_sale_df)

        cars_list = cars_for_sale_df.to_dict('records')
        year_range = generate_year_range(cars_for_sale_df)

        return jsonify({
            "success": True,
            "cars": cars_list,
            "year_range": year_range
        })
    except Exception as e:
        app.logger.error(f"Error fetching cars for sale: {str(e)}")
        return jsonify({"success": False, "error": f"Unable to fetch cars for sale: {str(e)}"}), 500


@app.route('/start-price-monitoring', methods=['GET'])
def start_price_monitoring():
    try:
        cars_predicted_df = pd.read_csv("./car_data/cars_predicted.csv", dtype=str)
        cars_predicted_df = cars_predicted_df.drop_duplicates(subset=['id'], keep='last', ignore_index=True)

        cars_predicted_df['Year'] = pd.to_numeric(cars_predicted_df['Year'], errors='coerce').astype('int64')
        numeric_fields = ['Kilometers', 'Price', 'Predicted_Price', 'price/expected_price']
        for field in numeric_fields:
            cars_predicted_df[field] = pd.to_numeric(cars_predicted_df[field], errors='coerce')

        underpriced_cars_df = cars_predicted_df[cars_predicted_df['Price'] > 0]
        undervalued_cars_df = underpriced_cars_df[
            (cars_predicted_df['price/expected_price'] < 1) & (cars_predicted_df['price/expected_price'] > 0)]

        undervalued_cars_df = preprocess_dataframe(undervalued_cars_df)
        undervalued_cars = undervalued_cars_df[
            ['Make', 'Model', 'Year', 'Kilometers', 'Regional Specs', 'Price', 'Predicted_Price',
             'price/expected_price',
             'Seller Type', 'Posted Datetime', 'Source', 'permalink']].to_dict(orient='records')

        year_range = generate_year_range(undervalued_cars_df)
        results = {
            "startTime": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "undervaluedCars": undervalued_cars,
            "year_range": year_range
        }
        return jsonify({"success": True, **results})
    except Exception as e:
        app.logger.error(f"Error in price monitoring: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({"success": False, "error": f"Unable to start price monitoring: {str(e)}"})


@app.route('/get-auction-cars', methods=['GET'])
def get_auction_cars():
    try:
        file_path = "./car_data/auction_sold_cars.csv"
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        auction_cars_df = pd.read_csv(file_path, dtype={'Id': str})
        app.logger.info(f"Successfully read CSV file. Shape: {auction_cars_df.shape}")

        if 'Id' not in auction_cars_df.columns:
            raise KeyError("Column 'Id' not found in the CSV file")

        auction_cars_df = auction_cars_df.drop_duplicates(subset=['Id'], keep='last', ignore_index=True)
        columns_to_keep = ['Make', 'Model', 'Year', 'Kilometers', 'Regional Specs', 'Primary Damage',
                           'Start Price', 'Final Price', 'Bid Difference',
                           'Bid Difference Percentage', 'Auction Date', 'Source']
        auction_cars_df = auction_cars_df[columns_to_keep]

        auction_cars_df['Year'] = pd.to_numeric(auction_cars_df['Year'], errors='coerce').astype('int64')
        numeric_fields = ['Kilometers', 'Start Price', 'Final Price', 'Bid Difference', 'Bid Difference Percentage']
        for field in numeric_fields:
            auction_cars_df[field] = pd.to_numeric(auction_cars_df[field], errors='coerce')

        auction_cars_df = auction_cars_df[auction_cars_df['Start Price'] > 0]

        # Convert DataFrame to dict, handling NaN values
        auction_cars = auction_cars_df.where(pd.notnull(auction_cars_df), None).to_dict(orient='records')

        return jsonify({"success": True, "cars": auction_cars})
    except Exception as e:
        app.logger.error(f"Error fetching auction cars: {str(e)}")
        return jsonify({"success": False, "error": f"Unable to fetch auction cars: {str(e)}"}), 500


@app.route('/get-data-analysis', methods=['GET'])
def get_data_analysis():
    try:
        cars_for_sale_df = pd.read_csv("./car_data/cars_for_sale.csv", dtype=str)
        cars_for_sale_df = cars_for_sale_df.drop_duplicates(subset=['id'], keep='last', ignore_index=True)

        cars_for_sale_df['Year'] = pd.to_numeric(cars_for_sale_df['Year'], errors='coerce').astype('int64')
        for field in ['Kilometers', 'Price']:
            cars_for_sale_df[field] = pd.to_numeric(cars_for_sale_df[field], errors='coerce')

        cars_for_sale_df = cars_for_sale_df[cars_for_sale_df['Price'] > 0]

        # Calculate age
        current_year = datetime.now().year
        cars_for_sale_df['Age'] = (current_year - cars_for_sale_df['Year']).astype(int)

        # Remove negative ages
        cars_for_sale_df = cars_for_sale_df[cars_for_sale_df['Age'] >= 0]
        cars_for_sale_df = cars_for_sale_df[cars_for_sale_df['Year'] >= 1990]

        # Create make-model distribution
        make_model_distribution = cars_for_sale_df.groupby('Make').apply(
            lambda x: {
                'total': len(x),
                'models': x['Model'].value_counts().to_dict()
            }
        ).to_dict()

        # Calculate top make-model combinations by average price
        top_make_model_by_avg_price = cars_for_sale_df.groupby(['Make', 'Model'])['Price'].mean().sort_values(
            ascending=False).head(10)
        top_make_model_by_avg_price = {f"{make} {model}": price for (make, model), price in
                                       top_make_model_by_avg_price.items()}

        # Calculate top make-model combinations by average kilometers
        top_make_model_by_avg_kilometers = cars_for_sale_df.groupby(['Make', 'Model'])['Kilometers'].mean().sort_values(
            ascending=False).head(10)
        top_make_model_by_avg_kilometers = {f"{make} {model}": km for (make, model), km in
                                            top_make_model_by_avg_kilometers.items()}

        # Filter out "Unknown" seller type for seller type distribution
        seller_type_distribution = cars_for_sale_df[cars_for_sale_df['Seller Type'] != 'Unknown'][
            'Seller Type'].value_counts().sort_values(ascending=False).to_dict()

        # Calculate average price by car age
        avg_price_by_age = cars_for_sale_df.groupby('Age')['Price'].mean().sort_index().to_dict()

        # Create price range column (0-500k AED)
        bins = list(range(0, 500001, 50000)) + [float('inf')]
        labels = [f'{bins[i] // 1000}k-{bins[i + 1] // 1000}k' for i in range(len(bins) - 1)]
        labels[-1] = '500k+'

        # Filter data for price range chart (0-500k AED)
        price_range_df = cars_for_sale_df[cars_for_sale_df['Price'] <= 500000]
        price_range_df['price_range'] = pd.cut(price_range_df['Price'], bins=bins, labels=labels, include_lowest=True)

        # Calculate price range distribution
        price_range_distribution = price_range_df['price_range'].value_counts().sort_index().to_dict()

        # Calculate Kilometers per Year
        cars_for_sale_df['Kilometers_per_Year'] = cars_for_sale_df['Kilometers'] / cars_for_sale_df['Age'].replace(0, 1)

        # Create bins for Kilometers per Year
        bins = [0, 5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, float('inf')]
        labels = ['0-5k', '5k-10k', '10k-15k', '15k-20k', '20k-25k', '25k-30k', '30k-35k', '35k-40k', '40k-45k',
                  '45k-50k', '50k+']

        cars_for_sale_df['km_per_year_range'] = pd.cut(cars_for_sale_df['Kilometers_per_Year'], bins=bins,
                                                       labels=labels, include_lowest=True)

        # Calculate Kilometers per Year distribution
        km_per_year_distribution = cars_for_sale_df['km_per_year_range'].value_counts().sort_index().to_dict()

        analysis = {
            "top_makes": cars_for_sale_df['Make'].value_counts().sort_values(ascending=False).head(10).to_dict(),
            "avg_price_by_make": cars_for_sale_df.groupby('Make')['Price'].mean().sort_values(ascending=False).head(
                10).to_dict(),
            "avg_kilometers_by_make": cars_for_sale_df.groupby('Make')['Kilometers'].mean().sort_values(
                ascending=False).head(10).to_dict(),
            "price_distribution": {
                "min": cars_for_sale_df['Price'].min(),
                "max": cars_for_sale_df['Price'].max(),
                "mean": cars_for_sale_df['Price'].mean(),
                "median": cars_for_sale_df['Price'].median(),
                "percentiles": cars_for_sale_df['Price'].quantile([0.25, 0.5, 0.75]).to_dict()
            },
            "year_distribution": cars_for_sale_df['Year'].astype(int).value_counts().sort_index().to_dict(),
            "regional_specs_distribution": cars_for_sale_df['Regional Specs'].value_counts().sort_values(
                ascending=False).to_dict(),
            "seller_type_distribution": seller_type_distribution,
            "body_type_distribution": cars_for_sale_df['Body Type'].value_counts().sort_values(ascending=False).head(
                10).to_dict(),
            "fuel_type_distribution": cars_for_sale_df['Fuel Type'].value_counts().sort_values(
                ascending=False).to_dict(),
            "transmission_type_distribution": cars_for_sale_df['Transmission Type'].value_counts().sort_values(
                ascending=False).to_dict(),
            "age_distribution": cars_for_sale_df['Age'].value_counts().sort_index().to_dict(),
            "price_by_age": cars_for_sale_df.groupby('Age')['Price'].mean().sort_index().to_dict(),
            "kilometers_by_age": cars_for_sale_df.groupby('Age')['Kilometers'].mean().sort_index().to_dict(),
            "make_model_distribution": make_model_distribution,
            "top_make_model_by_avg_price": top_make_model_by_avg_price,
            "top_make_model_by_avg_kilometers": top_make_model_by_avg_kilometers,
            "avg_price_by_age": avg_price_by_age,
            "price_range_distribution": price_range_distribution,
            "km_per_year_distribution": km_per_year_distribution
        }

        # Add grouped_top_makes
        analysis['grouped_top_makes'] = cars_for_sale_df.groupby('Source')['Make'].value_counts().unstack(
            fill_value=0).head(10).to_dict()

        # Preprocess the analysis data to handle NaN and inf values
        analysis = json.loads(json.dumps(analysis, cls=NpEncoder))

        return jsonify({"success": True, "analysis": analysis})
    except Exception as e:
        app.logger.error(f"Error in data analysis: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({"success": False, "error": f"Unable to perform data analysis: {str(e)}"})


@app.route('/get-sold-out-data-analysis', methods=['GET'])
def get_sold_out_data_analysis():
    try:
        sold_out_df = pd.read_csv("./car_data/dubizzle_cars_sold_out.csv", dtype=str)
        sold_out_df = sold_out_df.drop_duplicates(subset=['id'], keep='last', ignore_index=True)

        sold_out_df['Year'] = pd.to_numeric(sold_out_df['Year'], errors='coerce').astype('int64')
        for field in ['Kilometers', 'Price']:
            sold_out_df[field] = pd.to_numeric(sold_out_df[field], errors='coerce')

        sold_out_df = sold_out_df[sold_out_df['Price'] >= 0]
        sold_out_df = sold_out_df[sold_out_df['Year'] >= 1990]

        # Calculate age
        current_year = datetime.now().year
        sold_out_df['Age'] = (current_year - sold_out_df['Year']).astype(int)

        # Remove negative ages
        sold_out_df = sold_out_df[sold_out_df['Age'] >= 0]

        # Create make-model distribution
        make_model_distribution = sold_out_df.groupby('Make').apply(
            lambda x: {
                'total': len(x),
                'models': x['Model'].value_counts().to_dict()
            }
        ).to_dict()

        # Top make-model combinations by average price
        top_make_model_by_avg_price = sold_out_df.groupby(['Make', 'Model'])['Price'].mean().round().astype(
            int).sort_values(ascending=False).head(10)
        top_make_model_by_avg_price = {f"{make} {model}": price for (make, model), price in
                                       top_make_model_by_avg_price.items()}

        # Top make-model combinations by average kilometers
        top_make_model_by_avg_kilometers = sold_out_df.groupby(['Make', 'Model'])['Kilometers'].mean().round().astype(
            int).sort_values(ascending=False).head(10)
        top_make_model_by_avg_kilometers = {f"{make} {model}": km for (make, model), km in
                                            top_make_model_by_avg_kilometers.items()}

        # Filter out "Unknown" seller type for seller type distribution
        seller_type_distribution = sold_out_df[sold_out_df['Seller Type'] != 'Unknown'][
            'Seller Type'].value_counts().sort_values(ascending=False).to_dict()

        # Calculate average price by car age
        avg_price_by_age = sold_out_df.groupby('Age')['Price'].mean().sort_index().to_dict()

        # Create price range column (0-500k AED)
        bins = list(range(0, 500001, 50000)) + [float('inf')]
        labels = [f'{bins[i] // 1000}k-{bins[i + 1] // 1000}k' for i in range(len(bins) - 1)]
        labels[-1] = '500k+'

        # Filter data for price range chart (0-500k AED)
        price_range_df = sold_out_df[sold_out_df['Price'] <= 500000]
        price_range_df['price_range'] = pd.cut(price_range_df['Price'], bins=bins, labels=labels,
                                               include_lowest=True)

        # Calculate price range distribution
        price_range_distribution = price_range_df['price_range'].value_counts().sort_index().to_dict()

        # Calculate Kilometers per Year
        sold_out_df['Kilometers_per_Year'] = sold_out_df['Kilometers'] / sold_out_df['Age'].replace(0, 1)

        # Create bins for Kilometers per Year
        bins = [0, 5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, float('inf')]
        labels = ['0-5k', '5k-10k', '10k-15k', '15k-20k', '20k-25k', '25k-30k', '30k-35k', '35k-40k', '40k-45k',
                  '45k-50k', '50k+']

        sold_out_df['km_per_year_range'] = pd.cut(sold_out_df['Kilometers_per_Year'], bins=bins,
                                                  labels=labels, include_lowest=True)

        # Calculate Kilometers per Year distribution
        km_per_year_distribution = sold_out_df['km_per_year_range'].value_counts().sort_index().to_dict()

        analysis = {
            "top_makes": sold_out_df['Make'].value_counts().sort_values(ascending=False).head(10).to_dict(),
            "avg_price_by_make": sold_out_df.groupby('Make')['Price'].mean().round().astype(int).sort_values(
                ascending=False).head(10).to_dict(),
            "avg_kilometers_by_make": sold_out_df.groupby('Make')['Kilometers'].mean().round().astype(int).sort_values(
                ascending=False).head(10).to_dict(),
            "price_distribution": {
                "min": int(sold_out_df['Price'].min()),
                "max": int(sold_out_df['Price'].max()),
                "mean": int(sold_out_df['Price'].mean()),
                "median": int(sold_out_df['Price'].median()),
                "percentiles": sold_out_df['Price'].quantile([0.25, 0.5, 0.75]).round().astype(int).to_dict()
            },
            "year_distribution": sold_out_df['Year'].astype(int).value_counts().sort_index().to_dict(),
            "regional_specs_distribution": sold_out_df['Regional Specs'].value_counts().sort_values(
                ascending=False).to_dict(),
            "seller_type_distribution": seller_type_distribution,
            "body_type_distribution": sold_out_df['Body Type'].value_counts().sort_values(ascending=False).head(
                10).to_dict(),
            "fuel_type_distribution": sold_out_df['Fuel Type'].value_counts().sort_values(
                ascending=False).to_dict(),
            "transmission_type_distribution": sold_out_df['Transmission Type'].value_counts().sort_values(
                ascending=False).to_dict(),
            "age_distribution": sold_out_df['Age'].value_counts().sort_index().to_dict(),
            "price_by_age": sold_out_df.groupby('Age')['Price'].mean().sort_index().to_dict(),
            "kilometers_by_age": sold_out_df.groupby('Age')['Kilometers'].mean().sort_index().to_dict(),
            "make_model_distribution": make_model_distribution,
            "top_make_model_by_avg_price": top_make_model_by_avg_price,
            "top_make_model_by_avg_kilometers": top_make_model_by_avg_kilometers,
            "avg_price_by_age": avg_price_by_age,
            "price_range_distribution": price_range_distribution,
            "km_per_year_distribution": km_per_year_distribution
        }

        # Preprocess the analysis data to handle NaN and inf values
        analysis = json.loads(json.dumps(analysis, cls=NpEncoder))

        return jsonify({"success": True, "analysis": analysis})
    except Exception as e:
        app.logger.error(f"Error in sold out data analysis: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({"success": False, "error": f"Unable to perform sold out data analysis: {str(e)}"})


@app.route('/get-auction-cars-analysis', methods=['GET'])
def get_auction_cars_analysis():
    app.logger.info("Auction cars analysis route called")
    try:
        auction_cars_df = pd.read_csv("./car_data/auction_sold_cars.csv", dtype=str)
        app.logger.info(f"Loaded {len(auction_cars_df)} rows from CSV")

        auction_cars_df = auction_cars_df.drop_duplicates(subset=['Id'], keep='last', ignore_index=True)
        app.logger.info(f"After dropping duplicates: {len(auction_cars_df)} rows")

        numeric_fields = ['Year', 'Kilometers', 'Start Price', 'Final Price', 'Bid Difference',
                          'Bid Difference Percentage']
        for field in numeric_fields:
            auction_cars_df[field] = pd.to_numeric(auction_cars_df[field], errors='coerce')

        analysis = {
            "make_distribution": auction_cars_df['Make'].value_counts().head(10).to_dict(),
            "make_model_distribution": (auction_cars_df['Make'] + " " + auction_cars_df['Model']).value_counts().head(
                10).to_dict(),
            "year_distribution": auction_cars_df['Year'].value_counts().sort_index().to_dict(),
            "odometer_distribution": auction_cars_df['Kilometers'].describe().to_dict(),
            "auction_date_distribution": auction_cars_df['Auction Date'].value_counts().sort_index().head(10).to_dict(),
            "specification_distribution": auction_cars_df['Regional Specs'].value_counts().to_dict(),
            "primary_damage_distribution": auction_cars_df['Primary Damage'].value_counts().head(10).to_dict(),
            "participation_distribution": auction_cars_df['Participation Count'].value_counts().sort_index().head(
                10).to_dict(),
            "bid_difference_distribution": auction_cars_df['Bid Difference'].describe().to_dict(),
        }

        total_cars = len(auction_cars_df)
        avg_price = auction_cars_df['Final Price'].mean()
        avg_bid_difference = auction_cars_df['Bid Difference'].mean()
        top_make = auction_cars_df['Make'].value_counts().index[0]

        overall_summary = f"Total auction cars: {total_cars}. Average final price: AED {avg_price:.2f}. "
        overall_summary += f"Average bid difference: AED {avg_bid_difference:.2f}. Most common make: {top_make}."

        analysis["overall_summary"] = overall_summary

        app.logger.info("Auction cars analysis completed successfully")
        return jsonify({"success": True, "analysis": analysis})
    except Exception as e:
        app.logger.error(f"Error in auction cars analysis: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({"success": False, "error": f"Unable to perform auction cars analysis: {str(e)}"})


if __name__ == '__main__':
    app.run(debug=True)