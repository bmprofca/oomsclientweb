import React, { useState } from "react";
import { FiArrowLeft, FiArrowRight, FiHome, FiRefreshCw, FiCheck, FiChevronRight } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { apiCall } from "../utils/apiCall";
import OomsAuthShell from "../components/auth/OomsAuthShell";
import AuthPortalSwitcher from "../components/auth/AuthPortalSwitcher";

export default function Login() {
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileSent, setMobileSent] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const syncOtp = (digits) => {
    setOtpDigits(digits);
    setOtp(digits.join(""));
  };

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const next = [...otpDigits];
      next[index] = value;
      syncOtp(next);
      if (value && index < 5) {
        document.getElementById(`ec-otp-${index + 1}`)?.focus();
      }
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^[0-9]{10}$/.test(mobile)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await apiCall("/auth/login/send-otp", "POST", {
        mobile,
      });
      const data = await response.json();
      if (response.ok && data.success !== false) {
        setMobileSent(mobile);
        setStep(2);
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError("");
    if (otp.length < 4) {
      setError("Enter the OTP sent to your registered mobile.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await apiCall("/auth/login", "POST", {
        mobile: mobileSent,
        otp,
      });
      const data = await response.json();
      if (response.ok && data.success !== false && data.token) {
        setTempToken(data.token);
        localStorage.setItem("ooms_user_data", JSON.stringify({ token: data.token }));

        const profileRes = await apiCall("/profile/list", "GET");
        const profileData = await profileRes.json();

        if (
          profileRes.ok &&
          profileData.success !== false &&
          profileData.data &&
          profileData.data.length > 0
        ) {
          if (profileData.data.length === 1) {
            setLoginSuccess(true);
            login(data.token, profileData.data[0], {
              countrycode: "91",
              mobile: mobileSent,
            });
          } else {
            setProfiles(profileData.data);
            setStep(3);
          }
        } else {
          setError("No profiles found for this user.");
          localStorage.removeItem("ooms_user_data");
        }
      } else {
        setError(data.message || "Invalid OTP.");
      }
    } catch {
      setError("Network error. Please try again.");
      localStorage.removeItem("ooms_user_data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSelect = (profile) => {
    setLoginSuccess(true);
    login(tempToken, profile, { countrycode: "91", mobile: mobileSent });
  };

  const goBack = () => {
    setStep(1);
    setError("");
    setOtp("");
    syncOtp(["", "", "", "", "", ""]);
    setProfiles([]);
    localStorage.removeItem("ooms_user_data");
  };

  return (
    <OomsAuthShell
      portalLabel="Client"
      features={[
        { icon: "✅", label: "Live task progress" },
        { icon: "📁", label: "Shared documents & files" },
        { icon: "🔔", label: "Firm updates & alerts" },
        { icon: "🛠️", label: "Service requests" },
        { icon: "💬", label: "Messages from your office" },
        { icon: "📅", label: "Deadlines & reminders" },
        { icon: "🧾", label: "Bills & payment status" },
        { icon: "👤", label: "Multi-profile access" },
      ]}
      footerNote="Secure client portal — all access is monitored"
    >
      <AuthPortalSwitcher active="client" />

      {!loginSuccess && (
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center shadow-lg mb-2 mx-auto ring-1 ring-indigo-200">
            <img src="/logo512.png" alt="OOMS" className="h-8 w-8 object-contain" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Welcome back</h2>
          <p className="text-xs text-slate-500 mt-1">
            {step === 1
              ? "Secure access to your client portal"
              : step === 2
                ? `Code sent to ${mobileSent}`
                : "Select a profile to continue"}
          </p>
          <div className="flex gap-1.5 justify-center mt-3">
            <div className={`h-[4px] w-8 rounded-full ${step >= 1 ? "bg-[#5c3fe6]" : "bg-slate-100"}`} />
            <div className={`h-[4px] w-8 rounded-full ${step >= 2 ? "bg-[#5c3fe6]" : "bg-slate-100"}`} />
            <div className={`h-[4px] w-8 rounded-full ${step >= 3 ? "bg-[#5c3fe6]" : "bg-slate-100"}`} />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          ⚠ {error}
        </div>
      )}

      {loginSuccess && (
        <div className="text-center py-6 animate-fade-in space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <FiCheck className="text-white" size={28} />
          </div>
          <h3 className="text-xl font-black text-slate-800">Login Successful!</h3>
          <p className="text-xs text-slate-400">Redirecting to your dashboard...</p>
        </div>
      )}

      {step === 1 && !loginSuccess && (
        <form onSubmit={handleSendOtp} className="animate-fade-in space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Mobile Number
            </label>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit mobile number"
              className="w-full px-4 py-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              disabled={isSubmitting}
              inputMode="numeric"
              maxLength={10}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || mobile.length !== 10}
            className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md ${
              isSubmitting || mobile.length !== 10
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-[#5c3fe6] hover:bg-[#4b30c5] text-white shadow-indigo-500/20"
            }`}
          >
            {isSubmitting ? (
              <>
                <FiRefreshCw className="animate-spin" size={13} /> Sending OTP...
              </>
            ) : (
              <>🔑 Request OTP</>
            )}
          </button>
        </form>
      )}

      {step === 2 && !loginSuccess && (
        <div className="animate-fade-in space-y-4">
          <div className="grid grid-cols-6 gap-2">
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                id={`ec-otp-${index}`}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                className="w-full text-center text-lg font-bold rounded-xl border py-2.5 bg-slate-50 border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"
                maxLength={1}
                inputMode="numeric"
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <button type="button" onClick={goBack} className="hover:text-slate-700 flex items-center gap-1">
              <FiArrowLeft size={12} /> Change number
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              className="text-[#5c3fe6] hover:text-[#4b30c5] flex items-center gap-1"
            >
              <FiRefreshCw size={10} /> Resend OTP
            </button>
          </div>
          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={isSubmitting || otp.length < 4}
            className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${
              isSubmitting || otp.length < 4
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-[#5c3fe6] hover:bg-[#4b30c5] text-white"
            }`}
          >
            {isSubmitting ? (
              <>
                <FiRefreshCw className="animate-spin" size={13} /> Verifying...
              </>
            ) : (
              <>
                Verify & Sign In <FiArrowRight size={13} />
              </>
            )}
          </button>
        </div>
      )}

      {step === 3 && !loginSuccess && (
        <div className="animate-fade-in space-y-3 max-h-56 overflow-y-auto">
          {profiles.map((profile, idx) => (
            <button
              key={`${profile.username || profile.name}-${idx}`}
              type="button"
              onClick={() => handleProfileSelect(profile)}
              className="w-full p-3 text-left rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center">
                  <FiHome size={14} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {profile.name || profile.username || "Profile"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {profile.email || profile.branch?.name || "Client profile"}
                  </span>
                </div>
              </div>
              <FiChevronRight size={14} className="text-slate-400" />
            </button>
          ))}
          <button
            type="button"
            onClick={goBack}
            className="w-full py-2.5 border border-slate-200 text-slate-500 text-xs font-bold rounded-xl hover:bg-slate-50 flex items-center justify-center gap-1.5"
          >
            <FiArrowLeft size={13} /> Back to Login
          </button>
        </div>
      )}

      {!loginSuccess && (
        <div className="flex items-center justify-center gap-6 text-[10px] text-slate-400 font-bold pt-1">
          <span>🔒 SSL secured</span>
          <span>👁️ Access logged</span>
        </div>
      )}
    </OomsAuthShell>
  );
}
