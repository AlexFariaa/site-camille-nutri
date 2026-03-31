with open('.tmp/article_body.html', 'r', encoding='utf-8') as f:
    content = f.read().strip()
backticks = content.count('`')
dollar_braces = content.count('${')
print(f'OK — backticks: {backticks} | dollar_braces: {dollar_braces} | length: {len(content)}')
