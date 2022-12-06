import pandas as pd
import numpy as np
import os
import sys
from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer

text = sys.argv[1]
sourcePreference = sys.argv[2]
destPreference = sys.argv[3]

model = M2M100ForConditionalGeneration.from_pretrained("facebook/m2m100_418M")
# model.save_pretrained("./models/")
tokenizer = M2M100Tokenizer.from_pretrained("facebook/m2m100_418M", src_lang=sourcePreference, tgt_lang=destPreference)
# tokenizer.save_pretrained("./models/tokenizer/")

# with open('input.txt','r',encoding='utf-8') as f:
#     text = f.readlines()
# text = text[0]

tokenizer.src_lang = sourcePreference
encoded_hi = tokenizer(text, return_tensors="pt")
generated_tokens = model.generate(**encoded_hi, forced_bos_token_id=tokenizer.get_lang_id(destPreference))
outputArray = tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)
print(outputArray[0])
sys.stdout.flush()
# with open('output.txt', 'wt',encoding='utf-8') as ff:
#     ff.write(outputArray[0])


