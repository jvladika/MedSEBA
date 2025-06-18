import pandas as pd

chunkSize = 1000  # The number of rows you want to process at a time
maxChunks = 200  # The maximum number of data blocks you want to process

chunksProcessed = 0
filePath = 'pubmed_landscape_data.csv'  

with pd.read_csv(filePath, chunksize=chunkSize) as reader:
    for chunk in reader:
        print(chunk.head())  

        chunksProcessed += 1
        if chunksProcessed >= maxChunks:
            break  