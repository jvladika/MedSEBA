# MedSEBA

Code repository of the CIKM 2025 Demo Paper "_MedSEBA: Synthesizing Evidence-Based Answers Grounded in Evolving Medical Literature_" [[ACM]](https://dl.acm.org/doi/10.1145/3746252.3761463) [[arXiv]](https://arxiv.org/abs/2509.00414).

<img src="https://github.com/jvladika/MedSEBA/blob/main/medseba_workflow.png?raw=true" width="800"/>


### Instructions to run

```
python -m venv sebaenv
source sebaenv/bin/activate
pip install -r requirements.txt
pip install -r backend/django/requirements.txt

cd backend/django
python manage.py runserver

cd frontend/seba-app
yarn install
yarn start
```

### Citation

```
@inproceedings{10.1145/3746252.3761463,
author = {Vladika, Juraj and Matthes, Florian},
title = {MedSEBA: Synthesizing Evidence-Based Answers Grounded in Evolving Medical Literature},
year = {2025},
isbn = {9798400720406},
publisher = {Association for Computing Machinery},
address = {New York, NY, USA},
url = {https://doi.org/10.1145/3746252.3761463},
doi = {10.1145/3746252.3761463},
abstract = {In the digital age, people often turn to the Internet in search of medical advice and recommendations. With the increasing volume of online content, it has become difficult to distinguish reliable sources from misleading information. Similarly, millions of medical studies are published every year, making it challenging for researchers to keep track of the latest scientific findings. These evolving studies can reach differing conclusions, which is not reflected in traditional search tools. To address these challenges, we introduce MedSEBA, an interactive AI-powered system for synthesizing evidence-based answers to medical questions. It utilizes the power of Large Language Models to generate coherent and expressive answers, but grounds them in trustworthy medical studies dynamically retrieved from the research database PubMed. The answers consist of key points and arguments, which can be traced back to respective studies. Notably, the platform also provides an overview of the extent to which the most relevant studies support or refute the given medical claim, and a visualization of how the research consensus evolved through time. Our user study revealed that medical experts and lay users find the system usable and helpful, and the provided answers trustworthy and informative. This makes the system well-suited for both everyday health questions and advanced research insights.},
booktitle = {Proceedings of the 34th ACM International Conference on Information and Knowledge Management},
pages = {6728–6732},
numpages = {5},
keywords = {information retrieval, knowledge discovery, medical ai, medical nlp, natural language processing, question answering, rag},
location = {Seoul, Republic of Korea},
series = {CIKM '25}
}
```

