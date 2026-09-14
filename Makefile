# mgit - common development tasks
#
#   make            list every target
#   make check      run the same gate as CI (format, lint, test)
#   make package    build a release archive plus checksum for this machine
#
# Every target can be inspected with `make help`; the variables below can be
# overridden on the command line, for example `make run ARGS='--list'`.

CARGO   ?= cargo
NPM     ?= npm
PYTHON  ?= python3
SITE_PORT ?= 8801
ARGS    ?=
VERSION ?= patch
DIST    ?= dist

# The host target triple, used by `package`. Evaluated lazily, so the other
# targets keep working on machines without rustc on the PATH.
TARGET  = $(shell rustc -vV 2> /dev/null | sed -n 's/^host: //p')

RELEASE_TARGETS = x86_64-unknown-linux-gnu x86_64-unknown-linux-musl \
                  aarch64-unknown-linux-gnu aarch64-unknown-linux-musl \
                  x86_64-apple-darwin aarch64-apple-darwin \
                  x86_64-pc-windows-msvc aarch64-pc-windows-msvc

.DEFAULT_GOAL := help
.SHELLFLAGS := -eu -c

.PHONY: help build release run test e2e fmt fmt-check lint lint-windows \
        check ci coverage coverage-html msrv cross-check package install \
        bump lint-scripts npm-test npm-vendor npm-pack clean \
        site site-serve site-test site-check site-audit site-assets

help: ## List the available targets
	@echo 'mgit targets:'
	@awk 'BEGIN { FS = ":.*?## " } /^[a-zA-Z_-]+:.*?## / { printf "  %-16s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ''
	@echo 'Variables: CARGO=$(CARGO) NPM=$(NPM) ARGS=$(ARGS) VERSION=$(VERSION) DIST=$(DIST) TARGET=$(TARGET)'

build: ## Compile the debug binary
	$(CARGO) build --locked

release: ## Compile the optimized binary
	$(CARGO) build --release --locked

run: ## Run the binary, for example: make run ARGS='--depth 2 --list'
	$(CARGO) run --quiet --locked -- $(ARGS)

test: ## Run every test (unit, integration and end to end)
	$(CARGO) test --all-targets --locked

e2e: ## Run only the end to end tests against the compiled binary
	$(CARGO) test --test e2e_test --locked

fmt: ## Format the sources
	$(CARGO) fmt --all

fmt-check: ## Verify the formatting without writing anything
	$(CARGO) fmt --all -- --check

lint: ## Run clippy with warnings treated as errors
	$(CARGO) clippy --all-targets --locked -- -D warnings

lint-windows: ## Run clippy for the Windows target (rustup target add x86_64-pc-windows-msvc)
	$(CARGO) clippy --all-targets --locked --target x86_64-pc-windows-msvc -- -D warnings

check: fmt-check lint test ## Run the gate that CI enforces before anything else

ci: check lint-scripts coverage npm-test ## Run everything the CI workflows run

coverage: ## Measure the line coverage (needs cargo-llvm-cov)
	$(CARGO) llvm-cov --all-targets --locked --summary-only

coverage-html: ## Write an HTML coverage report to target/coverage
	$(CARGO) llvm-cov --all-targets --locked --html --output-dir target/coverage
	@echo 'Open target/coverage/index.html'

msrv: ## Run the tests with the oldest supported Rust from rust-version in Cargo.toml
	@toolchain=$$(awk -F'"' '/^\[/ { s = $$0 } s == "[package]" && /^rust-version = / { print $$2; exit }' Cargo.toml); \
	case "$$toolchain" in *.*.*) ;; *) toolchain="$$toolchain.0" ;; esac; \
	echo "==> cargo test with Rust $$toolchain"; \
	rustup run "$$toolchain" $(CARGO) test --all-targets --locked

cross-check: ## cargo check for every release target that is installed
	@for target in $(RELEASE_TARGETS); do \
		if rustup target list --installed | grep -qx "$$target"; then \
			echo "==> $$target"; \
			$(CARGO) check --locked --target "$$target" || exit 1; \
		else \
			echo "==> $$target (skipped, install it with: rustup target add $$target)"; \
		fi; \
	done

package: release ## Build the release archive and its checksum into dist/
	@target="$(TARGET)"; \
	if [ -z "$$target" ]; then echo 'cannot determine the target triple, is rustc installed?'; exit 1; fi; \
	mkdir -p $(DIST); \
	cd $(DIST); \
	case "$$target" in \
		*windows*) \
			archive="mgit-$$target.zip"; \
			rm -f "$$archive"; \
			tar -a -c -f "$$archive" -C "$(CURDIR)/target/release" mgit.exe ;; \
		*) \
			archive="mgit-$$target.tar.gz"; \
			tar -czf "$$archive" -C "$(CURDIR)/target/release" mgit ;; \
	esac; \
	if command -v sha256sum > /dev/null 2>&1; then \
		sha256sum "$$archive" > "$$archive.sha256"; \
	elif command -v shasum > /dev/null 2>&1; then \
		shasum -a 256 "$$archive" > "$$archive.sha256"; \
	else \
		echo 'no sha256 tool found (need sha256sum or shasum)'; exit 1; \
	fi; \
	cat "$$archive.sha256"

install: ## Install the binary into the Cargo bin directory
	$(CARGO) install --path . --locked --force

bump: ## Bump the version: make bump VERSION=minor (patch, major or an explicit version)
	./scripts/bump-version.sh $(VERSION)

lint-scripts: ## Lint the shell scripts and the workflows (shellcheck, actionlint)
	@if command -v shellcheck > /dev/null 2>&1; then shellcheck install.sh scripts/*.sh && echo 'shellcheck: ok'; else echo 'shellcheck not installed, skipping'; fi
	@if command -v actionlint > /dev/null 2>&1; then actionlint && echo 'actionlint: ok'; else echo 'actionlint not installed, skipping'; fi

npm-test: ## Run the npm wrapper tests (node --test, uses the Rust binary when it exists)
	cd npm && $(NPM) test

npm-vendor: ## Vendor this machine's archive from dist/ into npm/vendor (run `make package` first)
	npm/scripts/vendor.sh $(DIST) host

npm-pack: ## Build the local npm tarball from dist/ (the release flow is in npm/PUBLISHING.md)
	npm/scripts/vendor.sh $(DIST) host
	cp LICENSE npm/LICENSE
	cd npm && $(NPM) pack

site: ## Rebuild every page of website/ from the content modules
	$(PYTHON) website/build/build.py

site-serve: ## Preview the site at http://localhost:8801/ (override with SITE_PORT)
	$(PYTHON) website/build/serve.py $(SITE_PORT)

site-test: ## Engine unit tests plus the parity test against target/release/mgit
	$(CARGO) build --release
	node --test website/tests/*.test.mjs

site-check: ## Contrast gate: WCAG AA against the worst pixel of every texture
	$(PYTHON) website/build/check-contrast.py

site-audit: ## Overflow, landmarks, labels and heading order at three viewports
	@echo 'Start `make site-serve` in another shell first.'
	node website/build/audit.mjs

site-assets: ## Regenerate the icons, the social card and the surface textures
	$(PYTHON) website/build/make-textures.py
	$(PYTHON) website/build/make-assets.py

clean: ## Remove the build output, the packaged archives and the npm vendor directory
	$(CARGO) clean
	rm -rf $(DIST) npm/vendor npm/LICENSE npm/*.tgz
