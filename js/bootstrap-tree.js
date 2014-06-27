$(document).ready(function() {

	// Plier/déplier les catégories
	$('.tree').find('li:has(ul)').find(' > span').attr('title', 'Replier la catégorie').on('click', function (e) {
        var children = $(this).parent('li').find(' > ul > li');
        if (children.is(':visible')) {
    		children.hide('fast');
    		$(this).attr('title', 'Déplier la catégorie').find(' > i')
				.addClass('glyphicon-folder-close').removeClass('glyphicon-folder-open');
        }
        else {
    		children.show('fast');
    		$(this).attr('title', 'Replier la catégorie').find(' > i')
				.addClass('glyphicon-folder-open').removeClass('glyphicon-folder-close');
        }
        e.stopPropagation();
    });

	// Sélectionner/désélectionner les données
	$('.tree').find('li:has(ul)').find(' > ul > li').attr('title', 'Sélectionner ces données').on('click', function (e) {
        if( $(this).attr('selected') )
        {
			$(this).attr('selected',null).find('i')
				.addClass('glyphicon-ok-circle').removeClass('glyphicon-ok-sign');
		}
		else
		{
			$(this).attr('selected','1').find('i')
				.addClass('glyphicon-ok-sign').removeClass('glyphicon-ok-circle');
		}
	});

});
