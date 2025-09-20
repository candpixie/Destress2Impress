# youtube_recommender.py
import requests

#youtube API is Emily's
YOUTUBE_API_KEY = "AIzaSyCb0DQcnV6XZKo67lh7GAB1IuawPnELpLU"
BASE_URL = "https://www.googleapis.com/youtube/v3/search"

def recommend_videos(stress_level):
    if stress_level >= 8:
        query = "deep calming music meditation sleep"
    elif stress_level >= 6:
        query = "relaxing piano nature sounds"
    elif stress_level >= 4:
        query = "chill lofi study beats"
    elif stress_level >= 2:
        query = "upbeat happy pop music"
    else:
        query = "energetic workout music dance"

    params = {
        'part': 'snippet',
        'q': query,
        'type': 'video',
        'maxResults': 3,
        'key': YOUTUBE_API_KEY
    }

    try:
        response = requests.get(BASE_URL, params=params)
        results = response.json()
        videos = []
        for item in results['items']:
            videos.append({
                'title': item['snippet']['title'],
                'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}"
            })
        return videos
    except:
        return [{'title': 'No connection', 'url': '#'}]
