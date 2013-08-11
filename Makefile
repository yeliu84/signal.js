builddir := build
src := signal.js

version := $(shell sed -n "s/^.*__version__[ ]*:[ ]*'\(.*\)'.*$$/\1/ p" $(src))
license := $(shell sed -n "s/^.*__license__[ ]*:[ ]*'\(.*\)'.*$$/\1/ p" $(src))
copyright := $(shell sed -n "s/^.*__copyright__[ ]*:[ ]*'\(.*\)'.*$$/\1/ p" $(src))

minified-js := $(builddir)/signal-$(version).min.js
minified-tmp := $(minified-js).tmp

all: minify header combine
remote: minify-remote header combine

minify: $(src) $(builddir)
	@which -s closure-compiler
	@if [ $$? -eq 0 ]; then \
		echo 'Minifying $(src)...'; \
		closure-compiler --js "$(src)" --js_output_file $(minified-tmp); \
	else \
		echo 'closure-compiler is not installed or not in PATH'; \
	fi

minify-remote: $(src) $(builddir)
	@echo 'Minifying $(src)...'
	@curl 'http://closure-compiler.appspot.com/compile' --progress-bar \
		-d compilation_level=SIMPLE_OPTIMIZATIONS \
		-d output_info=compiled_code \
		-d output_format=text \
		--data-urlencode js_code@$(src) \
		-o $(minified-tmp)

$(builddir):
	@mkdir -p "$(builddir)"

header:
	@echo '/*'                                             > $(minified-js)
	@echo ' * SignalJS - Signals and Slots in JavaScript' >> $(minified-js)
	@echo ' *'                                            >> $(minified-js)
	@echo ' * Version:  $(version)'                       >> $(minified-js)
	@echo ' * License:  $(license)'                       >> $(minified-js)
	@echo ' * Build on: $(shell date -u)'                 >> $(minified-js)
	@echo ' *'                                            >> $(minified-js)
	@echo ' * $(copyright)'                               >> $(minified-js)
	@echo ' */'                                           >> $(minified-js)

combine:
	@if [ -f "$(minified-tmp)" ]; then \
		grep -q '__version__' "$(minified-tmp)"; \
		if [ $$? -eq 0 ]; then \
			cat $(minified-tmp) >> $(minified-js); \
		else \
			echo 'Minifying seems failed, the output is:'; \
			cat "$(minified-tmp)"; \
		fi; \
		rm "$(minified-tmp)"; \
	else \
		echo "$(minified-tmp) does not exist"; \
	fi

clean:
	rm -rf build/*

karma := ./node_modules/.bin/karma
karma_conf := karma.conf.js

test:
	$(karma) start --single-run --no-auto-watch $(karma_conf)

start_test:
	$(karma) start $(karma_conf)

.PHONY: all remote minify minify-remote header combine clean test start_test
