
name="TestExtension"

pushd src
rm -f ../build/$name.oex
zip -r ../build/$name.zip ./config.xml ./includes/* ./js/* ./css/* ./*.html ./*.css ./*.js
popd
mv build/$name.zip build/$name.oex

