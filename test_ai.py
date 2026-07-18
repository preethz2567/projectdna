import requests

try:
    res = requests.post('http://localhost:5002/index', json={
        "repository_id": "test",
        "repo_data": {}
    })
    print(res.status_code)
    print(res.text)
except Exception as e:
    print(e)
