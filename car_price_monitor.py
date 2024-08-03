import schedule
import time
import pandas as pd
import numpy as np
import joblib
import ast
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import matplotlib.pyplot as plt
import io
import base64


def check_new_listings():
    try:
        model = joblib.load(
            "./models/['Age', 'Kilometers', 'Make', 'Model', 'Trim', 'Regional Specs', 'Age_Kilometers', 'Kilometers_per_Year']_best_xgb.joblib")
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    col_to_select = ['id', 'Make', 'Model', 'Year', 'Kilometers', 'Trim', 'Regional Specs', 'Price', 'Seller Type',
                     'Posted Datetime', 'Source', 'permalink', 'No of Doors', 'Body Type', 'Fuel Type', 'Interior Color',
                     'Exterior Color', 'Transmission Type', 'Steering Side', 'Seating Capacity']

    dubizzle_cars_df_1 = pd.read_csv("./car_data/dubizzle_cars_for_sale.csv", dtype=str)
    dubizzle_cars_df_2 = pd.read_csv("./car_data/dubizzle_cars_on_sale.csv", dtype=str)
    dubizzle_cars_df = pd.concat([dubizzle_cars_df_1, dubizzle_cars_df_2], ignore_index=True)
    dubizzle_cars_df = dubizzle_cars_df.drop_duplicates(subset=['id'], keep='last', ignore_index=True)
    dubizzle_cars_df.dropna(subset=['id'], inplace=True)
    dubizzle_cars_df['Posted Datetime'] = pd.to_datetime(dubizzle_cars_df['added'], unit='s', errors='coerce').dt.strftime('%Y-%m-%dT%H:%M:%S')
    dubizzle_cars_df['Seller Type'] = dubizzle_cars_df['Seller Type'].str.replace('Dealership/Certified Pre-Owned','Dealer')
    dubizzle_cars_df['Source'] = 'Dubizzle'
    dubizzle_cars_df = dubizzle_cars_df.rename(columns={'Doors': 'No of Doors'})
    dubizzle_cars_df['No of Doors'] = dubizzle_cars_df['No of Doors'].str.strip(' doors')
    dubizzle_cars_df['Seating Capacity'] = dubizzle_cars_df['Seating Capacity'].str.strip(' Seater')
    dubizzle_cars_df = dubizzle_cars_df[col_to_select]

    dubicars_df = pd.read_csv("./car_data/dubicars_for_sale.csv", dtype=str)
    dubicars_df = dubicars_df.drop_duplicates(subset=['item_id'], keep='last', ignore_index=True)
    dubicars_df.drop(dubicars_df[dubicars_df['item_id'] == '714672.0'].index, inplace=True)
    dubicars_df.dropna(subset=['item_id'], inplace=True)
    dubicars_df['No of Doors'] = None
    dubicars_df['Interior Color'] = None
    dubicars_df['Posted Datetime'] = 'Unknown'
    dubicars_df['seller_type'] = dubicars_df['seller_type'].str.replace('Private', 'Owner')
    dubicars_df['Source'] = 'Dubicars'
    dubicars_df = dubicars_df.rename(columns={'item_id': 'id', 'car_make': 'Make', 'car_model': 'Model',
                                              'car_year': 'Year', 'mileage': 'Kilometers', 'car_trim': 'Trim',
                                              'regional_specs': 'Regional Specs', 'price': 'Price', 'item_link': 'permalink',
                                              'seller_type': 'Seller Type', 'steering_side': 'Steering Side', 'body_type': 'Body Type',
                                              'fuel_type': 'Fuel Type', 'seats': 'Seating Capacity', 'gearbox': 'Transmission Type',
                                              'color': 'Exterior Color'})

    dubicars_df['Steering Side'] = dubicars_df['Steering Side'].str.title()
    dubicars_df['Body Type'] = (dubicars_df['Body Type'].str.replace('SUV/Crossover', 'SUV').str
                                .replace('Truck', 'Utility Truck').str.replace('Station Wagon', 'Wagon'))
    dubicars_df['Fuel Type'] = dubicars_df['Fuel Type'].str.replace('Gasoline', 'Petrol')
    dubicars_df['Exterior Color'] = dubicars_df['Exterior Color'].str.title()
    dubicars_df['Transmission Type'] = dubicars_df['Transmission Type'] + ' Transmission'
    dubicars_df['Seating Capacity'] = dubicars_df['Seating Capacity'].str.replace('9+', '8+')
    dubicars_df['Regional Specs'] = dubicars_df['Regional Specs'] + ' Specs'
    dubicars_df['Regional Specs'] = dubicars_df['Regional Specs'].str.replace('Other Specs', 'Other')
    dubicars_df = dubicars_df[col_to_select]

    carswitch_df = pd.read_csv("./car_data/carswitch_cars_for_sale.csv", dtype=str)
    carswitch_df = carswitch_df.drop_duplicates(subset=['id'], keep='last', ignore_index=True)
    carswitch_df.dropna(subset=['id'], inplace=True)
    carswitch_df['Trim'] = 'Unknown'
    carswitch_df['Posted Datetime'] = 'Unknown'
    carswitch_df['Seller Type'] = 'Unknown'
    carswitch_df['Source'] = 'Carswitch'
    carswitch_df['No of Doors'] = None
    carswitch_df['Body Type'] = None
    carswitch_df['Fuel Type'] = None
    carswitch_df['Interior Color'] = None
    carswitch_df['Exterior Color'] = None
    carswitch_df['Transmission Type'] = None
    carswitch_df['Steering Side'] = None
    carswitch_df['Seating Capacity'] = None
    carswitch_df = carswitch_df.rename(columns={'make': 'Make', 'model': 'Model', 'year': 'Year',
                                                'mileage': 'Kilometers', 'specs': 'Regional Specs',
                                                'price': 'Price', 'url': 'permalink'})

    carswitch_df['Regional Specs'] = (carswitch_df['Regional Specs'].str.replace('America Specs', 'American Specs').
                                      str.replace('Canadia Specs', 'Canadian Specs').
                                      str.replace('Europea Specs', 'European Specs').str.replace('European', 'European Specs').
                                      str.replace('American', 'American Specs').str.replace('GCC', 'GCC Specs').str.strip(' Specs') + ' Specs')
    carswitch_df['Regional Specs'] = carswitch_df['Regional Specs'].str.replace('Japan Specs', 'Japanese Specs')
    carswitch_df['Regional Specs'] = carswitch_df['Regional Specs'].str.replace('Non GCC Specs', 'Other')

    for index, row in carswitch_df.iterrows():
        title_list = row['title'].split()
        for title in title_list:
            if row['Make'] == title.lower():
                row['Make'] = title
            elif '-' in row['Make']:
                row['Make'] = row['Make'].replace('-', ' ').title()
            elif row['Model'] == title.lower():
                carswitch_df.at[index, 'Model'] = title
            elif '-' in row['Model']:
                carswitch_df.at[index, 'Model'] = row['Model'].replace('-', ' ').title()

        if isinstance(row['Kilometers'], str):
            value_without_metric = row['Kilometers'].split()[0].replace(',', '').replace('KM', '').replace('Miles', '').strip()
            if value_without_metric != 'KM':
                if 'Miles' in row['Kilometers'] :
                    if value_without_metric != '':
                        carswitch_df.at[index, 'Kilometers'] = int(value_without_metric) * 1.6
                    else:
                        carswitch_df.at[index, 'Kilometers'] = None
                elif 'KM' in row['Kilometers'] :
                    if value_without_metric != '':
                        carswitch_df.at[index, 'Kilometers'] = int(value_without_metric)
                    else:
                        carswitch_df.at[index, 'Kilometers'] = None
            else:
                carswitch_df.at[index, 'Kilometers'] = 0

    carswitch_df = carswitch_df[col_to_select]

    car24_df = pd.read_csv("./car_data/cars24_cars_for_sale.csv", dtype=str)
    car24_df = car24_df.drop_duplicates(subset=['appointmentId'], keep='last', ignore_index=True)
    car24_df.dropna(subset=['appointmentId'], inplace=True)
    car24_df['Seller Type'] = ((car24_df['assortmentCategory'].str.replace('PRIME', 'Dealer').
                                      str.replace('LITE', 'Dealer').str.replace('PRIVATE_SELLER_PRO', 'Owner')).
                                      str.replace('PRIVATE_SELLER', 'Owner'))
    car24_df['Posted Datetime'] = 'Unknown'
    car24_df['Source'] = 'Cars24'
    car24_df['Trim'] = car24_df['variant']
    car24_df['No of Doors'] = None
    car24_df['Body Type'] = None
    car24_df['Interior Color'] = None
    car24_df['Steering Side'] = None
    car24_df['Seating Capacity'] = None
    car24_df = car24_df.rename(columns={'appointmentId': 'id', 'make': 'Make', 'model': 'Model', 'year': 'Year',
                                        'odometerReading': 'Kilometers', 'specs': 'Regional Specs', 'price': 'Price',
                                        'url': 'permalink', 'carExteriorColor': 'Exterior Color', 'transmissionType': 'Transmission Type',
                                        'fuelType': 'Fuel Type'})

    car24_df['Exterior Color'] = car24_df['Exterior Color'].str.replace('Other', 'Other Color')
    car24_df['Transmission Type'] = car24_df['Transmission Type'] + ' Transmission'
    car24_df['Transmission Type'] = car24_df['Transmission Type'].apply(lambda x: None if x == 'None Transmission' else x)
    car24_df['Regional Specs'] = car24_df['Regional Specs'].str.replace('GCC', 'GCC Specs')
    car24_df['Make'] = car24_df['Make'].str.strip().str.title()
    car24_df['Model'] = car24_df['Model'].str.strip().str.title()
    car24_df = car24_df[col_to_select]

    cars_df = pd.concat([dubizzle_cars_df, dubicars_df, carswitch_df, car24_df], ignore_index=True)

    make_list = cars_df['Make'].unique()
    model_list = cars_df['Model'].unique()

    telegram_df = pd.read_csv("./car_data/telegram.csv", dtype=str)
    telegram_df = telegram_df.drop_duplicates(subset=['id'], keep='last', ignore_index=True)

    telegram_cars_df = pd.read_csv("./car_data/telegram_cars_gemini.csv", dtype=str)
    telegram_cars_df = telegram_cars_df.drop_duplicates(subset=['Id'], keep='last', ignore_index=True)
    telegram_cars_df = telegram_cars_df.rename(columns={'Id': 'id', 'Mileage': 'Kilometers', 'RegionalSpecs': 'Regional Specs',
                                                        'Date': 'Posted Datetime'})

    telegram_cars_df = pd.merge(telegram_cars_df, telegram_df, on='id', how='inner')
    telegram_cars_df['permalink'] = 'https://t.me/' + telegram_cars_df['chat_username']

    telegram_cars_df.dropna(subset=['Make', 'Model'], inplace=True)
    telegram_cars_df = telegram_cars_df[telegram_cars_df['Make'].isin(make_list)]
    telegram_cars_df = telegram_cars_df[telegram_cars_df['Model'].isin(model_list)]
    telegram_cars_df = telegram_cars_df[telegram_cars_df['SellorBuy'] == 'Sell']

    telegram_cars_df['Source'] = 'Telegram'
    telegram_cars_df['Seller Type'] = 'Unknown'
    telegram_cars_df['Trim'] = 'Unknown'
    telegram_cars_df['No of Doors'] = None
    telegram_cars_df['Body Type'] = None
    telegram_cars_df['Fuel Type'] = None
    telegram_cars_df['Interior Color'] = None
    telegram_cars_df['Exterior Color'] = None
    telegram_cars_df['Transmission Type'] = None
    telegram_cars_df['Steering Side'] = None
    telegram_cars_df['Seating Capacity'] = None
    telegram_cars_df['Price'] = (telegram_cars_df['Price'].str.replace('AED', '').str.replace(',', '').
                                 str.replace('迪', '').str.strip())

    two_month_ago = datetime.now() - timedelta(days=60)
    telegram_cars_df['Posted Datetime'] = pd.to_datetime(telegram_cars_df['Posted Datetime'], errors='coerce')
    telegram_cars_df = telegram_cars_df[telegram_cars_df['Posted Datetime'] > two_month_ago]
    telegram_cars_df['Regional Specs'] = (telegram_cars_df['Regional Specs'].str.replace('GCC', 'GCC Specs').
                                          str.replace('American', 'American Specs').str.replace('MiddleEast', 'GCC Specs').
                                          str.replace('Gcc', 'GCC Specs').str.replace('US-spec', 'American Specs').
                                          str.replace('Canadian', 'Canadian Specs').str.replace('USSpec', 'American Specs').
                                          str.replace('NorthAmerican', 'American Specs').str.replace('NorthAmerica', 'American Specs').
                                          str.replace('US', 'American Specs').str.replace('Notprovided', 'Unknown').
                                          str.replace('Domesticversion', 'GCC Specs').str.replace('RightFrontDamaged', 'Unknown').
                                          str.replace('MidEast', 'GCC Specs').str.replace('GCC SpecsEdition', 'GCC Specs').
                                          str.replace('GCC SpecsGCC Specs', 'GCC Specs').str.replace('gcc', 'GCC Specs').
                                          str.replace('NotProvided', 'Unknown').str.replace('FullOption', 'Unknown').
                                          str.replace('Overseasversion', 'Unknown'))
    telegram_cars_df['Regional Specs'].fillna('Unknown', inplace=True)

    telegram_cars_df = telegram_cars_df.dropna(subset=['Year', 'Kilometers', 'Price'])
    telegram_cars_df['Year'] = telegram_cars_df['Year'].apply(lambda x: '20' + x if len(x) ==2 else x)
    telegram_cars_df['Kilometers'] = telegram_cars_df['Kilometers'].apply(lambda x: x + '00000' if len(x) <= 2 else x)
    telegram_cars_df['Price'] = (telegram_cars_df['Price'].str.replace('x', '').replace('NotProvided', '').str.strip().
                                 apply(lambda x: x + '0000' if len(x) <= 2 else x))

    telegram_cars_df =telegram_cars_df[col_to_select]

    # cars_df = pd.concat([cars_df, telegram_cars_df], ignore_index=True)
    cars_df.to_csv("./car_data/cars_for_sale.csv", index=False)

    make_to_predict_list = dubizzle_cars_df['Make'].unique()
    model_to_predict_list = dubizzle_cars_df['Model'].unique()
    spec_to_predict_list = dubizzle_cars_df['Regional Specs'].unique()
    trim_to_predict_list = dubizzle_cars_df['Trim'].unique()

    cars_df = cars_df[cars_df['Make'].isin(make_to_predict_list)]
    cars_df = cars_df[cars_df['Model'].isin(model_to_predict_list)]
    cars_df = cars_df[cars_df['Regional Specs'].isin(spec_to_predict_list)]
    cars_df = cars_df[cars_df['Trim'].isin(trim_to_predict_list)]

    numeric_fields = ['Kilometers', 'Year', 'Price']
    for field in numeric_fields:
        cars_df[field] = pd.to_numeric(cars_df[field], errors='coerce')

    current_year = datetime.now().year
    cars_df['Age'] = current_year - cars_df['Year']
    cars_df['Age_Kilometers'] = cars_df['Age'] * cars_df['Kilometers']
    cars_df['Kilometers_per_Year'] = cars_df['Kilometers'] / cars_df['Age'].replace(0, 1)

    model_features = ['Age', 'Kilometers', 'Make', 'Model', 'Trim', 'Regional Specs', 'Age_Kilometers',
                      'Kilometers_per_Year']
    cars_df_model = cars_df[model_features]

    cars_df['Predicted_Price'] = model.predict(cars_df_model).astype(int)
    cars_df['price/expected_price'] = cars_df['Price'] / cars_df['Predicted_Price'].replace(0, 1)
    cars_df.to_csv("./car_data/cars_predicted.csv", index=False)
    print("Price monitoring data saved to price_monitoring.csv", datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    return cars_df

def check_sold_cars():
    # Implement sold cars check
    col_to_select = ['id', 'Make', 'Model', 'Year', 'Kilometers', 'Trim', 'Regional Specs', 'Price', 'Seller Type',
                     'Posted Datetime', 'Source', 'permalink', 'No of Doors', 'Body Type', 'Fuel Type',
                     'Interior Color',
                     'Exterior Color', 'Transmission Type', 'Steering Side', 'Seating Capacity']

    dubizzle_cars_df = pd.read_csv("./car_data/dubizzle_cars_sold_out.csv", dtype=str)
    dubizzle_cars_df = dubizzle_cars_df.drop_duplicates(subset=['id'], keep='last', ignore_index=True)
    dubizzle_cars_df.dropna(subset=['id'], inplace=True)
    dubizzle_cars_df['Posted Datetime'] = pd.to_datetime(dubizzle_cars_df['added'], unit='s',
                                                         errors='coerce').dt.strftime('%Y-%m-%dT%H:%M:%S')
    dubizzle_cars_df['Seller Type'] = dubizzle_cars_df['Seller Type'].str.replace('Dealership/Certified Pre-Owned',
                                                                                  'Dealer')
    dubizzle_cars_df['Source'] = 'Dubizzle'
    dubizzle_cars_df = dubizzle_cars_df.rename(columns={'Doors': 'No of Doors'})
    dubizzle_cars_df['No of Doors'] = dubizzle_cars_df['No of Doors'].str.strip(' doors')
    dubizzle_cars_df['Seating Capacity'] = dubizzle_cars_df['Seating Capacity'].str.strip(' Seater')
    dubizzle_cars_df = dubizzle_cars_df[col_to_select]
    dubizzle_cars_df.to_csv("./car_data/dubizzle_cars_sold_out.csv", index=False)
    print("Sold cars data saved to dubizzle_cars_sold_out.csv", datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    return dubizzle_cars_df


def check_auction_cars():
    # Implement auction cars check
    marhaba_cars_df = pd.read_csv("./car_data/marhaba_auctions_cars_details.csv", dtype=str)
    pd.set_option('expand_frame_repr', False)
    marhaba_cars_df = marhaba_cars_df.drop_duplicates(subset=['_id'], keep='last', ignore_index=True)
    marhaba_cars_df.dropna(subset=['_id'], inplace=True)
    marhaba_cars_df['sale_status'] = 0
    marhaba_cars_df.loc[marhaba_cars_df['sold'] != '[]', 'sale_status'] = 1
    marhaba_sold_cars_df = marhaba_cars_df[marhaba_cars_df['sold'] != '[]']
    marhaba_sold_cars_df.reset_index(drop=True, inplace=True)
    marhaba_sold_cars_df = expand_sold_column(marhaba_sold_cars_df)
    marhaba_sold_cars_df = marhaba_sold_cars_df.join(pd.json_normalize(marhaba_sold_cars_df['sold']))
    marhaba_sold_cars_df['odometer'] = marhaba_sold_cars_df['odometer'].str.replace(' ', '').str.replace('UNKNOWN', '')
    marhaba_sold_cars_df['odometer'] = pd.to_numeric(marhaba_sold_cars_df['odometer'], errors='coerce')
    marhaba_sold_cars_df['Kilometers'] = marhaba_sold_cars_df['odometer']
    marhaba_sold_cars_df.loc[marhaba_sold_cars_df['odometer_type'] == 'Miles', 'kilometers'] = marhaba_sold_cars_df.loc[
                                                                                                   marhaba_sold_cars_df[
                                                                                                       'odometer_type']
                                                                                                   == 'Miles', 'odometer'] * 1.6
    marhaba_sold_cars_df['bid_starting'] = marhaba_sold_cars_df['bid_starting'].astype(int)
    marhaba_sold_cars_df['Bid Difference'] = marhaba_sold_cars_df['bid_amount'] - marhaba_sold_cars_df['bid_starting']
    marhaba_sold_cars_df['Bid Difference Percentage'] = (marhaba_sold_cars_df['Bid Difference'] / marhaba_sold_cars_df['bid_starting']) * 100
    marhaba_sold_cars_df['Bid Difference Percentage'] = marhaba_sold_cars_df['Bid Difference Percentage'].round(2)
    marhaba_sold_cars_df['Bid Difference Percentage'] = marhaba_sold_cars_df['Bid Difference Percentage'].replace([np.inf, -np.inf], np.nan)
    marhaba_sold_cars_df.rename(columns={'_id': 'Id', 'make_title': 'Make', 'model_title': 'Model', 'bid_starting': 'Start Price',
                                         'bid_amount': 'Final Price', 'body_type': 'Body Type', 'primary_damage': 'Primary Damage',
                                         'secondary_damage': 'Secondary Damage', 'exterior_color': 'Exterior Color',
                                         'interior_color': 'Interior Color', 'transmission': 'Transmission',
                                         'specification': 'Regional Specs', 'cylinders': 'Cylinders',
                                         'participation_count': 'Participation Count', 'engine_type': 'Engine Type',
                                         'fuel': 'Fuel Type', 'year': 'Year', 'auction_date': 'Auction Date'},
                                         inplace=True)
    marhaba_sold_cars_df['Make'] = marhaba_sold_cars_df['Make'].str.title()
    marhaba_sold_cars_df['Model'] = marhaba_sold_cars_df['Model'].str.title()
    marhaba_sold_cars_df['Body Type'] = marhaba_sold_cars_df['Body Type'].str.title()
    marhaba_sold_cars_df['Transmission'] = marhaba_sold_cars_df['Transmission'] + ' Transmission'
    marhaba_sold_cars_df['Regional Specs'] = marhaba_sold_cars_df['Regional Specs'].str.title() + ' Specs'
    marhaba_sold_cars_df['Fuel Type'] = marhaba_sold_cars_df['Fuel Type'].str.title().str.replace(' E/P', '')
    marhaba_sold_cars_df['Interior Color'] = marhaba_sold_cars_df['Interior Color'].str.title().str.replace('And', '&')
    marhaba_sold_cars_df['Exterior Color'] = marhaba_sold_cars_df['Exterior Color'].str.title().str.replace('And', '&')
    marhaba_sold_cars_df['Seating Capacity'] = None
    marhaba_sold_cars_df['No of Doors'] = None
    marhaba_sold_cars_df['Source'] = 'Marhaba Auctions'

    cols_to_keep = ['Id', 'Make', 'Model', 'Year', 'Kilometers', 'Regional Specs', 'Transmission', 'Body Type',
                    'Engine Type', 'Cylinders', 'Fuel Type', 'Interior Color', 'Exterior Color', 'Seating Capacity',
                    'No of Doors', 'Primary Damage', 'Secondary Damage', 'Auction Date', 'Start Price', 'Final Price',
                    'Bid Difference', 'Bid Difference Percentage', 'Participation Count', 'Source']

    marhaba_sold_cars_df = marhaba_sold_cars_df[cols_to_keep]
    marhaba_sold_cars_df.to_csv("./car_data/marhaba_auctions_sold_cars.csv", index=False)

    emirates_auction_cars_details_df = pd.read_csv("./car_data/emirates_auction_cars_details.csv", dtype=str)
    emirates_auction_cars_details_df.drop_duplicates(subset=['Lot'], keep='last', ignore_index=True, inplace=True)
    emirates_auction_cars_details_df.dropna(subset=['Lot', 'Odometer'], inplace=True)

    emirates_auction_cars_df = pd.read_csv("./car_data/emirates_auction_cars.csv", dtype=str)
    emirates_auction_cars_df.sort_values(by='UpdatedDatetime', inplace=True)
    emirates_auction_cars_df['UpdatedDatetime'] = (pd.to_datetime(emirates_auction_cars_df['UpdatedDatetime'].
                                                                 astype(float), unit= 's', errors='coerce').
                                                   dt.strftime('%Y-%m-%d'))
    emirates_auction_cars_df['EndDate'] = (pd.to_datetime(emirates_auction_cars_df['EndDate'], errors='coerce').
                                           dt.strftime('%Y-%m-%d'))

    emirates_auction_end_cars_df = emirates_auction_cars_df.drop_duplicates(subset=['Lot'], keep='last', ignore_index=True)
    emirates_auction_end_cars_df = emirates_auction_end_cars_df[emirates_auction_end_cars_df['UpdatedDatetime'] ==
                                                                emirates_auction_end_cars_df['EndDate']]
    emirates_auction_end_cars_df.dropna(subset=['Lot', 'Milage'], inplace=True)
    emirates_auction_start_cars_df = emirates_auction_cars_df.drop_duplicates(subset=['Lot'], keep='first', ignore_index=True)
    emirates_auction_start_cars_df = emirates_auction_start_cars_df[emirates_auction_start_cars_df['UpdatedDatetime'] !=
                                                                    emirates_auction_start_cars_df['EndDate']]
    emirates_auction_start_cars_df.dropna(subset=['Lot', 'Milage'], inplace=True)

    merged_emirates_auction_end_cars_df = pd.merge(emirates_auction_end_cars_df, emirates_auction_cars_details_df,
                                                   on='Lot', how='left')
    merged_emirates_auction_end_cars_df.rename(columns={'CurrentPrice': 'Final Price'}, inplace=True)
    merged_emirates_auction_start_cars_df = pd.merge(emirates_auction_start_cars_df, emirates_auction_cars_details_df,
                                                     on='Lot', how='left')
    merged_emirates_auction_start_cars_df.rename(columns={'CurrentPrice': 'Start Price'}, inplace=True)
    merged_emirates_auction_cars_df = pd.merge(merged_emirates_auction_end_cars_df, merged_emirates_auction_start_cars_df[
                                               ['Lot', 'Start Price']], on='Lot', how='inner')

    merged_emirates_auction_cars_df.rename(columns={'Lot': 'Id', 'BodyType': 'Body Type', 'Exterior': 'Exterior Color',
                                                    'FuelType': 'Fuel Type', 'CountryOfMade': 'Regional Specs',
                                                    'EndDate': 'Auction Date', 'Milage': 'Kilometers',
                                                    'Interior': 'Interior Color', 'Seats': 'Seating Capacity',
                                                    'Doors': 'No of Doors'}, inplace=True)

    merged_emirates_auction_cars_df['Engine Type'] = None
    merged_emirates_auction_cars_df['Cylinders'] = None
    merged_emirates_auction_cars_df['Primary Damage'] = None
    merged_emirates_auction_cars_df['Secondary Damage'] = None
    merged_emirates_auction_cars_df['Participation Count'] = None
    merged_emirates_auction_cars_df['Source'] = 'Emirates Auction'
    merged_emirates_auction_cars_df['Start Price'] = merged_emirates_auction_cars_df['Start Price'].astype(int)
    merged_emirates_auction_cars_df['Final Price'] = merged_emirates_auction_cars_df['Final Price'].astype(int)
    merged_emirates_auction_cars_df['Bid Difference'] = merged_emirates_auction_cars_df['Final Price'] - merged_emirates_auction_cars_df['Start Price']
    merged_emirates_auction_cars_df['Bid Difference Percentage'] = (merged_emirates_auction_cars_df['Bid Difference'] / merged_emirates_auction_cars_df['Start Price']) * 100
    merged_emirates_auction_cars_df['Bid Difference Percentage'] = merged_emirates_auction_cars_df['Bid Difference Percentage'].round(2)
    merged_emirates_auction_cars_df['Bid Difference Percentage'] = merged_emirates_auction_cars_df['Bid Difference Percentage'].replace([np.inf, -np.inf], np.nan)
    merged_emirates_auction_cars_df['Transmission'] = merged_emirates_auction_cars_df['Transmission'] + ' Transmission'
    merged_emirates_auction_cars_df['Make'] = (merged_emirates_auction_cars_df['Make'].str.title().str.
                                               replace('Bmw', 'BMW')).str.replace('Gmc', 'GMC').str.replace('Mg', 'MG')
    merged_emirates_auction_cars_df['Regional Specs'] = ((((((merged_emirates_auction_cars_df['Regional Specs'].
                                                        str.replace('United Arab Emirates', 'GCC Specs')).
                                                        str.replace('Japan', 'Japanese Specs')).
                                                        str.replace('China mainland', 'Chinese Specs')).
                                                        str.replace('SOUTH KOREA', 'Korean Specs')).
                                                        str.replace('Canada', 'Canadian Specs')).
                                                        str.replace('Thailand', 'Other').
                                                        str.replace('South Africa', 'Other').
                                                        str.replace('Australia', 'Other').
                                                        str.replace('Mexico', 'Other').
                                                        str.replace('Germany', 'European Specs').
                                                        str.replace('Sweden', 'European Specs').
                                                        str.replace('United Kingdo', 'European Specs').
                                                        str.replace('India', 'Other').
                                                        str.replace('Spain', 'European Specs').
                                                        str.replace('Italy', 'European Specs').
                                                        str.replace('Brazil', 'Other').
                                                        str.replace('Afghanistan', 'Other').
                                                        str.replace('Morocco', 'Other').
                                                        str.replace('Turkey', 'Other').
                                                        str.replace('Belgiu', 'European Specs').
                                                        str.replace('Indonesia', 'Other').
                                                        str.replace('Taiwan', 'Other').
                                                        str.replace('Portugal', 'European Specs').
                                                        str.replace('Netherlands', 'European Specs').
                                                        str.replace('Slovakia', 'European Specs').
                                                        str.replace('Hungary', 'European Specs').
                                                        str.replace('France', 'European Specs').
                                                        str.replace('Austria', 'European Specs').
                                                        str.replace('Romania', 'European Specs').
                                                        str.replace('United States', 'American Specs'))

    merged_emirates_auction_cars_df = merged_emirates_auction_cars_df[cols_to_keep]
    merged_auction_cars_df = pd.concat([marhaba_sold_cars_df, merged_emirates_auction_cars_df], ignore_index=True)
    merged_auction_cars_df.dropna(subset=['Make', 'Model', 'Year', 'Kilometers', 'Regional Specs', 'Final Price'], inplace=True)
    merged_auction_cars_df.to_csv("./car_data/auction_sold_cars.csv", index=False)

    merged_auction_cars_df['Year'] = pd.to_numeric(merged_auction_cars_df['Year'], errors='coerce').astype('int64')
    numeric_fields = ['Kilometers', 'Start Price', 'Final Price', 'Bid Difference', 'Bid Difference Percentage']
    for field in numeric_fields:
        merged_auction_cars_df[field] = pd.to_numeric(merged_auction_cars_df[field], errors='coerce')

    merged_auction_cars_df = merged_auction_cars_df[merged_auction_cars_df['Start Price'] > 0]

    # Calculate Age
    current_year = datetime.now().year
    merged_auction_cars_df['Age'] = current_year - merged_auction_cars_df['Year']

    predicted_price = merged_auction_cars_df.apply(get_predicted_prices, axis=1)
    print(predicted_price)

    predicted_prices = merged_auction_cars_df.apply(get_predicted_prices, axis=1)
    merged_auction_cars_df['Min_Predicted_Price'] = predicted_prices['Min_Predicted_Price']
    merged_auction_cars_df['Max_Predicted_Price'] = predicted_prices['Max_Predicted_Price']
    merged_auction_cars_df['Predicted Price'] = (merged_auction_cars_df['Min_Predicted_Price'] + merged_auction_cars_df['Max_Predicted_Price']) / 2

    # Calculate ratios
    merged_auction_cars_df['Min_Final_Price_Predicted_Ratio'] = merged_auction_cars_df['Final Price'] / merged_auction_cars_df[
        'Max_Predicted_Price']
    merged_auction_cars_df['Max_Final_Price_Predicted_Ratio'] = merged_auction_cars_df['Final Price'] / merged_auction_cars_df[
        'Min_Predicted_Price']

    merged_auction_cars_df['Final Price Predicted Ratio'] = merged_auction_cars_df['Final Price'] / merged_auction_cars_df['Predicted Price']

    merged_auction_cars_df.to_csv("./car_data/auction_sold_cars.csv", index=False)
    print("Auction cars data saved to auction_sold_cars.csv", datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

    return merged_auction_cars_df

def expand_sold_column(df):
  df = df.copy()
  df['sold'] = df['sold'].apply(ast.literal_eval)
  return df


def get_predicted_prices(row):
    try:
        MODEL = joblib.load(
            "./models/['Age', 'Kilometers', 'Make', 'Model', 'Trim', 'Regional Specs', 'Age_Kilometers', 'Kilometers_per_Year']_best_xgb.joblib")
    except Exception as e:
        print(f"Error loading model: {e}")
        return
    make = row['Make']
    model = row['Model']

    sold_out_df = pd.read_csv("./car_data/dubizzle_cars_sold_out.csv", dtype=str)

    # Filter sold_out_df for the same make and model
    relevant_cars = sold_out_df[(sold_out_df['Make'] == make) & (sold_out_df['Model'] == model)]
    relevant_cars = relevant_cars.dropna(subset=['Trim'])
    relevant_cars = relevant_cars[relevant_cars['Trim'] != 'None']
    relevant_cars['Trim'] = relevant_cars['Trim'].astype(str)

    if relevant_cars.empty:
        return pd.Series({'Min_Predicted_Price': None, 'Max_Predicted_Price': None})

    # Get unique trims
    trims = relevant_cars['Trim'].unique()

    predicted_prices = []
    for trim in trims:
        input_data = pd.DataFrame({
            'Age': [row['Age']],
            'Kilometers': [row['Kilometers']],
            'Make': [make],
            'Model': [model],
            'Trim': [trim],
            'Regional Specs': [row['Regional Specs']],
        })

        # Calculate derived features
        input_data['Age_Kilometers'] = input_data['Age'] * input_data['Kilometers']
        input_data['Kilometers_per_Year'] = input_data['Kilometers'] / input_data['Age'].replace(0, 1)

        # Make prediction
        prediction = MODEL.predict(input_data)[0]
        predicted_prices.append(prediction)

        print(f"Predicted price for {make} {model} ({trim}): {prediction}")

    return pd.Series({
        'Min_Predicted_Price': min(predicted_prices),
        'Max_Predicted_Price': max(predicted_prices)
    })


def analyze_model_performance():
    # Load the data
    df = pd.read_csv("D:\data_analysis\cars_data_scraping\data\dubizzle\dubizzle_cars_sold_out.csv")

    # Handling Outliers
    Q1 = df['Price'].quantile(0.25)
    Q3 = df['Price'].quantile(0.75)
    IQR = Q3 - Q1

    df_filtered = df[~((df['Price'] < (Q1 - 1.5 * IQR)) | (df['Price'] > (Q3 + 1.5 * IQR)))]

    # df_filtered = df.copy()

    # df_filtered = df_filtered[(df_filtered['Price'] <= 200000) & (df_filtered['Price'] >= 10000)]
    df_filtered = df_filtered[df_filtered['Transmission Type'] == 'Automatic Transmission']
    df_filtered = df_filtered[df_filtered['Fuel Type'] == 'Petrol']
    df_filtered = df_filtered[df_filtered['Steering Side'] == 'Left Hand']

    # Feature Engineering
    df_filtered['Age'] = 2024 - df_filtered['Year']
    df_filtered['Age_Kilometers'] = df_filtered['Age'] * df_filtered['Kilometers']
    df_filtered['Kilometers_per_Year'] = df_filtered['Kilometers'] / df_filtered['Age'].replace(0, 1)
    features = ['Age', 'Kilometers', 'Make', 'Model', 'Trim', 'Regional Specs', 'Age_Kilometers', 'Kilometers_per_Year']

    # Drop any rows with missing values
    df_filtered = df_filtered.dropna(subset=features + ['Price'])

    X = df_filtered[features]
    y = df_filtered['Price']

    # Split the data into training and test sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Load the model
    model = joblib.load("./models/['Age', 'Kilometers', 'Make', 'Model', 'Trim', 'Regional Specs', 'Age_Kilometers', 'Kilometers_per_Year']_best_xgb.joblib")

    print(model)
    # Make predictions
    y_pred = model.predict(X_test)

    # Calculate metrics
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    # Calculate residuals and residuals percentage
    residuals = y_test - y_pred
    residuals_percentage = (residuals / y_test) * 100

    abs_residuals = np.abs(residuals)
    abs_residuals_percentage = np.abs(residuals_percentage)

    pd.set_option('display.max_columns', None)

    price_df = pd.DataFrame({'Actual Price': y_test, 'Predicted Price': y_pred, 'Residuals': residuals,
                             'Residuals Percentage': residuals_percentage, 'Abs Residuals': abs_residuals,
                             'Abs Residuals Percentage': abs_residuals_percentage})

    # Descriptive statistics
    train_stats = y_train.describe()
    test_stats = y_test.describe()

    print(test_stats)
    print(train_stats)

    # Residual analysis
    mean_residual_percentage = np.mean(residuals_percentage)
    std_residual_percentage = np.std(residuals_percentage)

    mean_abs_residual = np.mean(abs_residuals)
    std_abs_residual = np.std(abs_residuals)

    mean_abs_residual_percentage = np.mean(abs_residuals_percentage)
    std_abs_residual_percentage = np.std(abs_residuals_percentage)


    print('rmse:', rmse, 'r2:', r2)

    print('residuals mean:',  np.mean(residuals), 'residuals std:', np.std(residuals))
    print('residuals precentage mean:', mean_residual_percentage, 'residuals precentage std:', std_residual_percentage)
    print('abs residuals mean:', mean_abs_residual, 'abs residuals std:', std_abs_residual)
    print('abs residuals precentage mean:', mean_abs_residual_percentage, 'abs residuals precentage std:', std_abs_residual_percentage)

    # Predicted vs Actual Values
    plt.figure(figsize=(10, 6))
    plt.scatter(y_pred, y_test, alpha=0.5)
    plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
    plt.xlabel('Predicted Values')
    plt.ylabel('Actual Values')
    plt.title('Predicted vs Actual Values')
    plt.show()

    # Residual Percentage Plot
    plt.figure(figsize=(10, 6))
    plt.scatter(y_pred, residuals_percentage, alpha=0.5)
    plt.xlabel('Predicted Values')
    plt.ylabel('Residuals Percentage')
    plt.title('Residual Percentage Plot')
    plt.axhline(y=0, color='r', linestyle='-')
    plt.show()

    # Histogram of residuals percentage
    plt.figure(figsize=(10, 6))
    plt.hist(residuals_percentage, bins=50)
    plt.xlabel('Residual Percentage Error')
    plt.ylabel('Frequency')
    plt.title('Distribution of Residual Percentage Errors')
    plt.show()

    # Scatter plots of residual percentage vs features
    for feature in ['Age', 'Kilometers', 'Kilometers_per_Year']:
        plt.figure(figsize=(10, 6))
        plt.scatter(X_test[feature], residuals_percentage, alpha=0.5)
        plt.xlabel(feature)
        plt.ylabel('Residuals Percentage')
        plt.title(f'Residual Percentage vs {feature}')
        plt.show()


def send_alert(car):
    # Implement alert system (e.g., email, push notification)
    print(f"Alert: Potential deal found - {car['Make']} {car['Model']} at {car['listed_price']}")


# analyze_model_performance()
# check_auction_cars()

check_new_listings()
check_sold_cars()
check_auction_cars()

# Run the check every hour
schedule.every().hour.do(check_new_listings)


while True:
    schedule.run_pending()
    time.sleep(1)