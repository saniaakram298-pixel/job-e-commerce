export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl tracking-tighter mb-2">THE ATELIER</h1>
          <p className="text-secondary text-sm uppercase tracking-widest">Create Account</p>
        </div>

        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-label mb-2 block">First Name</label>
              <input
                type="text"
                placeholder="John"
                className="input-base"
              />
            </div>
            <div>
              <label className="text-label mb-2 block">Last Name</label>
              <input
                type="text"
                placeholder="Doe"
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label className="text-label mb-2 block">Email Address</label>
            <input
              type="email"
              placeholder="your@email.com"
              className="input-base"
            />
          </div>

          <div>
            <label className="text-label mb-2 block">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="input-base"
            />
            <p className="text-xs text-secondary mt-2">
              At least 8 characters with numbers and special characters
            </p>
          </div>

          <div>
            <label className="text-label mb-2 block">Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="input-base"
            />
          </div>

          <label className="flex items-center gap-3">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-xs">
              I agree to the{' '}
              <a href="#" className="text-primary font-bold hover:text-primary-fixed">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary font-bold hover:text-primary-fixed">
                Privacy Policy
              </a>
            </span>
          </label>

          <button type="submit" className="w-full btn-primary">
            Create Account
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-secondary">
            Already have an account?{' '}
            <a href="/login" className="text-primary font-bold hover:text-primary-fixed">
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
