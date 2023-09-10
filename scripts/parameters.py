import json
import fileinput

json_parameters = json.loads(open('.stack/config.json').read());

for variable in json_parameters['parameters']:
    key=variable
    value=json_parameters['parameters'][variable]
    print(key + "=" + str(value))
    for line in fileinput.input(".stack/config.json",inplace=True):
         print(line.replace('${'+key+'}', str(value)), end="")
