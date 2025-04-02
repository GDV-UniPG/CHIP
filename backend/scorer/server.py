import grpc
from concurrent import futures
import pandas as pd
import numpy as np
from gensim.models import KeyedVectors
import gensim.downloader as api
from sklearn.metrics.pairwise import cosine_similarity
import poi_toi_pb2
import poi_toi_pb2_grpc
from gensim.parsing.preprocessing import remove_stopwords
from nltk.tokenize import word_tokenize
import pyarrow as pa
import pyarrow.parquet as pq
import fastparquet

import nltk
nltk.download('punkt_tab')

#scarica il modello Word2vec (solo al primo avvio)
w2v_model = api.load('word2vec-google-news-300')
#salva il modello Word2vec (solo al primo avvio)
w2v_model.save("word2vec_google_news.model")

#carica il modello word2vec salvato in locale in seguito al primo avvio.
#w2v_model = KeyedVectors.load("word2vec_google_news.model", mmap='r')

class PoiToiScorerServicer(poi_toi_pb2_grpc.PoiToiScorerServicer):
    def calculate_embedding(self, text):
        
        cleaned_text = remove_stopwords(text.lower())
        tokens = word_tokenize(cleaned_text)

        embeddings = [
            w2v_model[word] for word in tokens if word in w2v_model
        ]
        if embeddings:
            cosine_centroid = np.mean(embeddings, axis=0)
            norm_cosine_centroid = cosine_centroid / np.linalg.norm(cosine_centroid)
            return norm_cosine_centroid 
        else:
            return np.zeros(w2v_model.vector_size)

    def CalculateScore(self, request, context):
        poi_df = pd.read_parquet("/app/shared/"+request.poi_file_path)
        toi_df = pd.read_parquet("/app/shared/"+request.toi_file_path)

        poi_df['embedding'] = poi_df['description'].apply(self.calculate_embedding)
        toi_df['embedding'] = toi_df['description'].apply(self.calculate_embedding)


        poi_embeddings = np.vstack(poi_df['embedding'].values)
        toi_embeddings = np.vstack(toi_df['embedding'].values)
        scores = np.maximum(cosine_similarity(poi_embeddings, toi_embeddings), 0)
        
        score_df = pd.DataFrame(scores, index=poi_df['id'], columns=toi_df['id'])

        long_score_df = score_df.reset_index().melt(id_vars='id', var_name='id_toi', value_name='score')
        long_score_df = long_score_df.rename(columns={'id': 'id_poi'})

        score_file_path = "poi_toi_scores.parquet"
        long_score_df.to_parquet("/app/shared/"+score_file_path, engine='fastparquet')

        return poi_toi_pb2.CalculateScoreResponse(score_file_path=score_file_path)

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    poi_toi_pb2_grpc.add_PoiToiScorerServicer_to_server(PoiToiScorerServicer(), server)
    server.add_insecure_port('0.0.0.0:3300')
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
