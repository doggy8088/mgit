.PHONY: install install-pwsh test test-pwsh clean

install:
	@chmod +x install.sh
	./install.sh

install-pwsh:
	pwsh ./install.ps1

test:
	@echo "Creating test Git repositories..."
	@mkdir -p test-repo1 test-repo2
	@cd test-repo1 && git init && git config user.name "Test User" && git config user.email "test@example.com" && touch a.txt && git add a.txt && git commit -m "commit 1"
	@cd test-repo2 && git init && git config user.name "Test User" && git config user.email "test@example.com" && touch b.txt && git add b.txt && git commit -m "commit 2"
	@echo "Running mgit (default command)..."
	@./mgit
	@echo "Running mgit status..."
	@./mgit status
	@$(MAKE) clean

test-pwsh:
	@echo "Creating test Git repositories..."
	@mkdir -p test-repo1 test-repo2
	@cd test-repo1 && git init && git config user.name "Test User" && git config user.email "test@example.com" && touch a.txt && git add a.txt && git commit -m "commit 1"
	@cd test-repo2 && git init && git config user.name "Test User" && git config user.email "test@example.com" && touch b.txt && git add b.txt && git commit -m "commit 2"
	@echo "Running mgit.ps1..."
	@pwsh ./mgit.ps1
	@$(MAKE) clean

clean:
	@rm -rf test-repo1 test-repo2
