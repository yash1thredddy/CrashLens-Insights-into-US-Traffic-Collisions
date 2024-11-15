import requests

def test_api():
    # Test basic connection
    try:
        response = requests.get('http://localhost:5000/api/test')
        print(f"Test endpoint: {response.status_code}")
        print(response.json())
    except Exception as e:
        print(f"Error connecting to test endpoint: {str(e)}")

    # Test map data endpoint
    try:
        response = requests.get('http://localhost:5000/api/spatial/map-data', 
                              params={'year': 2016})
        print(f"\nMap data endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Points received: {len(data.get('points', []))}")
        else:
            print(f"Error response: {response.text}")
    except Exception as e:
        print(f"Error connecting to map data endpoint: {str(e)}")

if __name__ == "__main__":
    test_api()