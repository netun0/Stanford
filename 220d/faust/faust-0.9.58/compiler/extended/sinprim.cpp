#include "xtended.hh"
#include "Text.hh"
#include <math.h>

#include "floats.hh"

class SinPrim : public xtended
{

 public:
 
 	SinPrim() : xtended("sin") {}
	
	virtual unsigned int arity () { return 1; }
	
	virtual bool	needCache ()	{ return true; }
	
	virtual Type 	infereSigType (const vector<Type>& args)
	{
		assert (args.size() == 1);
		return castInterval(floatCast(args[0]), interval(-1,1));
	}
	
	virtual void 	sigVisit (Tree sig, sigvisitor* visitor) {}	
	
	virtual int infereSigOrder (const vector<int>& args) {
		return args[0];
	}

	
	virtual Tree	computeSigOutput (const vector<Tree>& args) {
		num n;
		if (isNum(args[0],n)) {
			return tree(sin(double(n)));
		} else {
			return tree(symbol(), args[0]);
		}
	}
		
	virtual string 	generateCode (Klass* klass, const vector<string>& args, const vector<Type>& types)
	{
		assert (args.size() == arity());
		assert (types.size() == arity());
		
        return subst("sin$1($0)", args[0], isuffix());
	}
	
	virtual string 	generateLateq (Lateq* lateq, const vector<string>& args, const vector<Type>& types)
	{
		assert (args.size() == arity());
		assert (types.size() == arity());
		
        return subst("\\sin\\left($0\\right)", args[0]);
	}
	
};


xtended* gSinPrim = new SinPrim();


