
name="TestExtension"

pushd src
rm -f ../build/$name.oex
zip -r ../build/$name.zip ./config.xml ./includes/* ./script/* ./*.html ./*.css ./*.js
popd
mv build/$name.zip build/$name.oex

cp src/script/storage.js build/
cp src/script/options_page.js build/
