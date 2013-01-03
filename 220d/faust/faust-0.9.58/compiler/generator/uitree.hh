/************************************************************************
 ************************************************************************
    FAUST compiler
	Copyright (C) 2003-2004 GRAME, Centre National de Creation Musicale
    ---------------------------------------------------------------------
    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
 ************************************************************************
 ************************************************************************/
 
 
 
#ifndef _UITREE_
#define _UITREE_

#include "tlib.hh"

Tree  	uiFolder(Tree label, Tree elements=nil);
Tree 	uiWidget(Tree label, Tree varname, Tree sig);

bool  	isUiFolder(Tree t);
bool  	isUiFolder(Tree t, Tree& label, Tree& elements);

bool 	isUiWidget(Tree t, Tree& label, Tree& varname, Tree& sig);


inline Tree uiLabel (Tree t)	{ return t->branch(0); }


//Tree putFolder(Tree folder, Tree item);
//Tree getFolder (Tree folder, Tree ilabel);
	
//Tree makeSubFolderChain(Tree path, Tree elem);

	
Tree putSubFolder(Tree folder, Tree path, Tree item);


#endif

