builddir := build
src := signal.js
minified := $(builddir)/signal.min.js
minifytmp := $(minified).tmp

version := $(shell sed -n "s/^.*__version__[ ]*:[ ]*'\(.*\)'.*$$/\1/ p" $(src))
license := $(shell sed -n "s/^.*__license__[ ]*:[ ]*'\(.*\)'.*$$/\1/ p" $(src))
copyright := $(shell sed -n "s/^.*__copyright__[ ]*:[ ]*'\(.*\)'.*$$/\1/ p" $(src))

all: minify header combine
remote: minify-remote header combine

minify:
	@which -s closure-compiler
	@if [ $$? -eq 0 ]; then \
		echo 'Minifying $(src)...'; \
		closure-compiler --js $(src) --js_output_file $(minifytmp); \
	else \
		echo 'closure-compiler is not installed or not in PATH'; \
	fi

minify-remote:
	@echo 'Minifying $(src)...'
	@curl 'http://closure-compiler.appspot.com/compile' --progress-bar \
		-d compilation_level=SIMPLE_OPTIMIZATIONS \
		-d output_info=compiled_code \
		-d output_format=text \
		--data-urlencode js_code@$(src) \
		-o $(minifytmp)

header:
	@echo '/*'                                             > $(minified)
	@echo ' * SignalJS - Signals and Slots in JavaScript' >> $(minified)
	@echo ' *'                                            >> $(minified)
	@echo ' * Version:  $(version)'                       >> $(minified)
	@echo ' * License:  $(license)'                       >> $(minified)
	@echo ' * Build on: $(shell date -u)'                 >> $(minified)
	@echo ' *'                                            >> $(minified)
	@echo ' * $(copyright)'                               >> $(minified)
	@echo ' */'                                           >> $(minified)

combine:
	@if [ -f "$(minifytmp)" ]; then \
		grep -q '__version__' "$(minifytmp)"; \
		if [ $$? -eq 0 ]; then \
			cat $(minifytmp) >> $(minified); \
		else \
			echo 'Minifying seems failed, the output is:'; \
			cat "$(minifytmp)"; \
		fi; \
		rm "$(minifytmp)"; \
	else \
		echo "$(minifytmp) does not exist"; \
	fi
