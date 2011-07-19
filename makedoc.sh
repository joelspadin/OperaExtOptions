#I use Cygwin. This makes shell scripts runnable.
source ~/.bash_profile

wdir="`pwd`"
script1="$wdir/build/storage.js"
script2="$wdir/build/options_page.js"
list="storage.js options_page.js"

rm -rf ./jsdoc

#If you want to use this script, change this to the location of JSDoc
pushd /c/Users/spadija/Programs/Programming/JSDoc
cp "$script1" .
cp "$script2" .

java -jar jsrun.jar app/run.js -a -t=templates/jsdoc $list
rm $list

cp -r ./out/jsdoc "$wdir/"

popd
